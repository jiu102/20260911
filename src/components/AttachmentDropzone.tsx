import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileArchive,
  Image as ImageIcon,
  FileCode,
  Download,
  Trash2,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { Attachment, User } from '../types';

interface AttachmentDropzoneProps {
  attachments: Attachment[];
  users: User[];
  onUpload: (file: File) => Promise<void>;
  onDelete?: (id: string) => void;
  canUpload?: boolean;
}

export const AttachmentDropzone: React.FC<AttachmentDropzoneProps> = ({
  attachments,
  users,
  onUpload,
  onDelete,
  canUpload = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`檔案「${file.name}」超過單檔 ${MAX_SIZE_MB}MB 限制！`);
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
    } catch (err: any) {
      setErrorMessage(err.message || '上傳失敗，請重試');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canUpload) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canUpload) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        await handleFileProcess(e.dataTransfer.files[i]);
      }
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        await handleFileProcess(e.target.files[i]);
      }
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileType.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4 text-[#111111]" />;
    }
    if (fileType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-4 h-4 text-[#CC0000]" />;
    }
    if (['dwg', 'dxf', 'rvt', 'ifc'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-[#111111]" />;
    }
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-[#111111]" />;
    }
    return <FileText className="w-4 h-4 text-[#111111]" />;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : '未知成員';
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Upload area */}
      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload-input"
            multiple
            className="hidden"
            onChange={onFileInputChange}
          />
          <div
            id="attachment-dropzone-box"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[#111111] p-4 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'bg-[#E5E5E0] hard-shadow'
                : 'bg-[#F9F9F7] hover:bg-white hard-shadow-sm'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <UploadCloud
                className={`w-6 h-6 transition-transform ${
                  isDragging ? 'text-[#CC0000] scale-110' : 'text-[#111111]'
                }`}
              />
              <div className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                {isUploading ? (
                  <span className="text-[#CC0000] animate-pulse">[ 檔案上傳傳輸中... ]</span>
                ) : (
                  <>
                    拖曳檔案至此，或 <span className="underline decoration-2 decoration-[#111111]">點擊選取檔案</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#737373] mt-0.5 font-mono">
                支援 PDF、DWG/CAD、BIM 模型、ZIP 壓縮檔、PNG、JPG (單檔上限 {MAX_SIZE_MB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-white bg-[#CC0000] border border-[#111111] p-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attachment List */}
      <div className="space-y-1.5">
        {attachments.length === 0 ? (
          <p className="text-[11px] text-[#737373] py-1">[ 目前無上傳附件檔案 ]</p>
        ) : (
          attachments.map((att) => {
            const isImg =
              att.fileType.includes('image') ||
              ['png', 'jpg', 'jpeg', 'webp'].some((ext) =>
                att.fileName.toLowerCase().endsWith(ext)
              );

            return (
              <div
                key={att.id}
                id={`attachment-row-${att.id}`}
                className="flex items-center justify-between p-2 bg-white border border-[#111111] hover:bg-[#F9F9F7] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-[#E5E5E0] border border-[#111111] shrink-0">
                    {getFileIcon(att.fileType, att.fileName)}
                  </div>
                  <div className="min-w-0 font-mono">
                    <p className="text-xs font-bold text-[#111111] truncate" title={att.fileName}>
                      {att.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#737373]">
                      <span>{formatFileSize(att.fileSize)}</span>
                      <span>•</span>
                      <span>{getUserName(att.uploadedById)}</span>
                      <span>•</span>
                      <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isImg && (
                    <button
                      type="button"
                      id={`preview-att-${att.id}`}
                      onClick={() => setPreviewImage({ url: att.filePath, title: att.fileName })}
                      title="檢視圖片"
                      className="p-1 text-[#111111] hover:bg-[#111111] hover:text-white border border-[#111111] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a
                    href={att.filePath}
                    download={att.fileName}
                    id={`download-att-${att.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="下載文件"
                    className="p-1 text-[#111111] hover:bg-[#111111] hover:text-white border border-[#111111] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  {onDelete && canUpload && (
                    <button
                      type="button"
                      id={`delete-att-${att.id}`}
                      onClick={() => onDelete(att.id)}
                      title="移除附件"
                      className="p-1 text-[#111111] hover:bg-[#CC0000] hover:text-white border border-[#111111] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-[#111111]/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-[#F9F9F7] border-4 border-[#111111] max-w-4xl max-h-[90vh] overflow-hidden hard-shadow flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#E5E5E0] border-b-2 border-[#111111]">
              <span className="font-mono font-bold text-xs text-[#111111] uppercase tracking-wider truncate">
                {previewImage.title}
              </span>
              <button
                type="button"
                id="close-preview-modal"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-[#111111] hover:bg-[#CC0000] hover:text-white border border-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-white max-h-[75vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto border border-[#111111] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
