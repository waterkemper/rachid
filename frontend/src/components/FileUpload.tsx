import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTimes, FaFile, FaImage, FaFilePdf } from 'react-icons/fa';
import './FileUpload.css';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxSize?: number; // em bytes
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxSize = MAX_FILE_SIZE,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  disabled = false,
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Processar arquivos rejeitados
      const newErrors: string[] = [];
      rejectedFiles.forEach(({ file, errors: fileErrors }) => {
        fileErrors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            newErrors.push(`${file.name}: Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024} MB`);
          } else if (error.code === 'file-invalid-type') {
            newErrors.push(`${file.name}: Tipo de arquivo não permitido`);
          } else {
            newErrors.push(`${file.name}: ${error.message}`);
          }
        });
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        setTimeout(() => setErrors([]), 5000);
      }

      // Adicionar arquivos aceitos
      if (acceptedFiles.length > 0) {
        const newFiles = [...files, ...acceptedFiles];
        onFilesChange(newFiles);
        setErrors([]);
      }
    },
    [files, onFilesChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    disabled,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FaImage />;
    }
    if (file.type === 'application/pdf') {
      return <FaFilePdf />;
    }
    return <FaFile />;
  };

  const previewImage = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`file-upload-dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <FaUpload className="upload-icon" />
        <p>
          {isDragActive
            ? 'Solte os arquivos aqui...'
            : 'Arraste arquivos aqui ou clique para selecionar'}
        </p>
        <p className="file-upload-hint">
          Formatos: Imagens (JPG, PNG, GIF, WebP), PDF, Documentos (DOC, DOCX, XLS, XLSX)
          <br />
          Tamanho máximo: {maxSize / 1024 / 1024} MB por arquivo
        </p>
      </div>

      {errors.length > 0 && (
        <div className="file-upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="file-upload-list">
          <h4>Arquivos selecionados ({files.length}):</h4>
          <div className="file-list">
            {files.map((file, index) => {
              const imagePreview = previewImage(file);
              return (
                <div key={index} className="file-item">
                  {imagePreview ? (
                    <div className="file-preview-image">
                      <img src={imagePreview} alt={file.name} />
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(index)}
                        title="Remover arquivo"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="file-preview-document">
                      <div className="file-icon">{getFileIcon(file)}</div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(index)}
                        title="Remover arquivo"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
