import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Plus, Trash2, RefreshCw } from 'lucide-react';
import { DiscordConfig, DiscordChannel } from '../models';

interface DiscordConfigModalProps {
  onClose: () => void;
  groupID: string;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const DiscordConfigModal: React.FC<DiscordConfigModalProps> = ({ onClose, groupID, showToast }) => {
  const [config, setConfig] = useState<DiscordConfig>({
    token: '',
    guildId: '',
    channelId: '',
    pollChannelId: '',
    channels: []
  });
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bot-config/${groupID}`)
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error(`API returned non-JSON response (${res.status})`);
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load bot config:', err);
        setLoading(false);
      });
  }, [groupID]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot-config/${groupID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error('Failed to save config');
      if (showToast) showToast('Đã lưu cấu hình Discord thành công!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message);
      if (showToast) showToast('Lỗi khi lưu cấu hình: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addChannel = () => {
    if (!newChannelName || !newChannelId) return;
    const newChannel: DiscordChannel = {
      id: newChannelId,
      name: newChannelName
    };
    setConfig({
      ...config,
      channels: [...(config.channels || []), newChannel]
    });
    setNewChannelName('');
    setNewChannelId('');
  };

  const removeChannel = (id: string) => {
    setConfig({
      ...config,
      channels: (config.channels || []).filter(c => c.id !== id)
    });
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#3F4147] bg-[#313338] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#1E1F22] bg-[#2B2D31] p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-[#5865F2]" size={20} />
            <h2 className="text-lg font-bold text-[#F2F3F5]">Cấu hình Discord Bot</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#949BA4] hover:bg-[#3F4147] hover:text-[#DBDEE1]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="rounded bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#3F4147] pb-2">Thông tin cơ bản</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">Bot Token</label>
              <input 
                type="password"
                value={config.token}
                onChange={e => setConfig({ ...config, token: e.target.value })}
                className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                placeholder="Nhập Discord Bot Token..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">Guild ID (Server ID)</label>
              <input 
                type="text"
                value={config.guildId}
                onChange={e => setConfig({ ...config, guildId: e.target.value })}
                className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                placeholder="Nhập Guild ID..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">Kênh mặc định (Default Channel)</label>
              <select
                value={config.channelId}
                onChange={e => setConfig({ ...config, channelId: e.target.value })}
                className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
              >
                <option value="">-- Chọn kênh mặc định --</option>
                {(config.channels || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
              <p className="text-[10px] text-[#949BA4]">Phải là kênh <b>VOICE</b>. Danh sách thành viên lấy từ những người đang ngồi trong kênh này.</p>
            </div>

            {/* Poll phải đăng vào kênh CHỮ. Trước đây dùng chung `channelId` với kênh voice
                nên poll chui vào khung chat của kênh voice: báo tạo thành công mà không ai
                thấy, vì chẳng ai mở chat trong kênh voice ra xem. */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#949BA4]">Kênh đăng Poll / thông báo</label>
              <select
                value={config.pollChannelId || ''}
                onChange={e => setConfig({ ...config, pollChannelId: e.target.value })}
                className="w-full rounded bg-[#1E1F22] border border-[#3F4147] p-2.5 text-sm text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
              >
                <option value="">-- Dùng chung kênh mặc định --</option>
                {(config.channels || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
              <p className="text-[10px] text-[#949BA4]">Nên chọn kênh <b>CHỮ</b>. Để trống thì poll đăng vào kênh mặc định ở trên, tức khung chat của kênh voice, rất dễ không ai thấy.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#949BA4] border-b border-[#3F4147] pb-2">Danh sách Channels</h3>
            
            <div className="space-y-3">
              {(config.channels || []).map((channel) => (
                <div key={channel.id} className="flex items-center gap-2 rounded bg-[#2B2D31] p-2 border border-[#3F4147]">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F2F3F5] truncate">{channel.name}</div>
                    <div className="text-[10px] text-[#949BA4] font-mono">{channel.id}</div>
                  </div>
                  <button 
                    onClick={() => removeChannel(channel.id)}
                    className="p-1.5 text-[#949BA4] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="space-y-2 rounded bg-[#1E1F22]/50 p-3 border border-dashed border-[#3F4147]">
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    className="rounded bg-[#1E1F22] border border-[#3F4147] p-2 text-xs text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                    placeholder="Tên kênh..."
                  />
                  <input 
                    type="text"
                    value={newChannelId}
                    onChange={e => setNewChannelId(e.target.value)}
                    className="rounded bg-[#1E1F22] border border-[#3F4147] p-2 text-xs text-[#DBDEE1] focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                    placeholder="ID kênh..."
                  />
                </div>
                <button 
                  onClick={addChannel}
                  disabled={!newChannelName || !newChannelId}
                  className="flex w-full items-center justify-center gap-2 rounded bg-[#3F4147] py-2 text-xs font-bold text-[#F2F3F5] hover:bg-[#4E5058] transition-colors disabled:opacity-50"
                >
                  <Plus size={14} />
                  Thêm kênh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#1E1F22] bg-[#2B2D31] p-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#DBDEE1] hover:underline"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded bg-[#5865F2] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[#4752C4] active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>
    </div>
  );
};
