// ContentManagementSection.jsx
import React, { useEffect } from 'react';
import { CloudUpload, Eye, Trash2 } from 'lucide-react';

const ContentManagementSection = ({ uploadedFiles = [], handleFileDrop, setSelectedFiles }) => {
  useEffect(() => {
    console.log('📁 uploadedFiles:', uploadedFiles);
  }, [uploadedFiles]);

  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    console.log('📤 Manual upload files:', files);
    const dropEvent = { preventDefault: () => {}, dataTransfer: { files } };
    await handleFileDrop(dropEvent);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Manajemen Konten Anda</h3>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 bg-white hover:bg-gray-50 transition-all cursor-pointer"
        onDrop={handleFileDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <CloudUpload size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-semibold mb-2">Drag and drop file di sini</p>
        <p className="text-gray-500 text-sm">atau klik untuk memilih file (MP4, MOV, MP3, JPG, PNG)</p>
        <input
          type="file"
          id="fileInput"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      <h4 className="text-lg font-bold text-gray-800 mb-4">File Anda ({uploadedFiles.length})</h4>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama File</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ukuran</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Upload</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {uploadedFiles.map(file => (
              <tr key={file.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.uploaded_at || file.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye size={18} />
                  </a>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {uploadedFiles.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">Belum ada file yang diunggah.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentManagementSection;