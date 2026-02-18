// packages/frontend/src/components/settings/MemorySettings.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { userMemoryService, type UserMemoryData } from '../../services/userMemory.service';

const MemorySettings: React.FC = () => {
    const [memoryData, setMemoryData] = useState<UserMemoryData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMemory();
    }, []);

    const fetchMemory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userMemoryService.getMemory();
            setMemoryData(data);
            setEditContent(data.content);
        } catch (err) {
            setError('加载记忆失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userMemoryService.updateMemory(editContent);
            setMemoryData(data);
            setIsEditing(false);
        } catch (err) {
            setError('保存记忆失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditContent(memoryData?.content || '');
    };

    if (loading && !memoryData) {
        return <div className="p-4 text-center">正在加载记忆...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">用户记忆 (长期)</h3>
                <div className="text-sm text-gray-500">
                    {memoryData?.last_consolidated_at
                        ? `最后更新于: ${new Date(memoryData.last_consolidated_at).toLocaleString()}`
                        : '暂无记忆'}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white border rounded-lg p-4 min-h-[200px] shadow-sm">
                {isEditing ? (
                    <textarea
                        className="w-full h-64 p-2 border rounded resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="在此输入关于用户的设想..."
                    />
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-700">
                        {memoryData?.content ? (
                            <ReactMarkdown>{memoryData.content}</ReactMarkdown>
                        ) : (
                            <div className="text-gray-400 italic">
                                暂无记忆。开始聊天以构建您的个人资料！
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                        >
                            {loading ? '保存中...' : '保存更改'}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        编辑记忆
                    </button>
                )}
            </div>
        </div>
    );
};

export default MemorySettings;
