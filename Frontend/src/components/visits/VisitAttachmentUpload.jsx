import { useState } from "react";
import {
  useUploadVisitAttachment,
  useUploadMultipleVisitAttachments,
  useVisitAttachments,
} from "../../hooks/useVisits";
import { useDeletePatientAttachment } from "../../hooks/usePatients";
import "./VisitAttachmentUpload.css";

const VisitAttachmentUpload = ({ visitId, patientId }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState("single"); // 'single' or 'multiple'
  const [dragActive, setDragActive] = useState(false);

  const uploadSingleMutation = useUploadVisitAttachment();
  const uploadMultipleMutation = useUploadMultipleVisitAttachments();
  const { data: attachments, isLoading: isLoadingAttachments } =
    useVisitAttachments(visitId);
  const deleteMutation = useDeletePatientAttachment();

  // Determine which mutation to use
  const isUploading =
    uploadSingleMutation.isLoading || uploadMultipleMutation.isLoading;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file");
      return;
    }

    const formData = new FormData();

    if (uploadMode === "single" && selectedFiles.length > 0) {
      formData.append("document", selectedFiles[0]);

      try {
        await uploadSingleMutation.mutateAsync({
          id: visitId,
          patientId,
          formData,
        });
        setSelectedFiles([]);
        document.getElementById("file-input").value = "";
        alert("File uploaded successfully!");
      } catch (error) {
        alert(
          "Failed to upload file: " +
            (error.response?.data?.message || error.message),
        );
      }
    } else if (uploadMode === "multiple" && selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        formData.append("documents", file);
      });

      try {
        await uploadMultipleMutation.mutateAsync({
          id: visitId,
          patientId,
          formData,
        });
        setSelectedFiles([]);
        document.getElementById("file-input").value = "";
        alert(`${selectedFiles.length} files uploaded successfully!`);
      } catch (error) {
        alert(
          "Failed to upload files: " +
            (error.response?.data?.message || error.message),
        );
      }
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        id: patientId,
        attachmentId,
      });
      alert("Attachment deleted successfully!");
    } catch (error) {
      alert(
        "Failed to delete attachment: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      if (files.length > 1) {
        setUploadMode("multiple");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    return "📎";
  };

  return (
    <div className="visit-attachment-upload">
      <h3 className="upload-title">📋 Medical Documents & Images</h3>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-mode-selector">
          <label>
            <input
              type="radio"
              value="single"
              checked={uploadMode === "single"}
              onChange={() => setUploadMode("single")}
            />
            Single File
          </label>
          <label>
            <input
              type="radio"
              value="multiple"
              checked={uploadMode === "multiple"}
              onChange={() => setUploadMode("multiple")}
            />
            Multiple Files
          </label>
        </div>

        <div
          className={`drop-zone ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            multiple={uploadMode === "multiple"}
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            <div className="drop-zone-content">
              <span className="upload-icon">📤</span>
              <p className="drop-zone-text">
                {dragActive
                  ? "Drop files here..."
                  : "Click to select or drag and drop files here"}
              </p>
              <p className="drop-zone-hint">
                Supported: Images, PDF, Word, Excel (Max 5MB per file)
              </p>
            </div>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h4>Selected Files ({selectedFiles.length}):</h4>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {getFileIcon(file.type)} {file.name}
                  <span className="file-size">
                    {" "}
                    ({formatFileSize(file.size)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className={`upload-button ${isUploading ? "uploading" : ""}`}
        >
          {isUploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <span>⬆️</span>
              Upload{" "}
              {selectedFiles.length > 1
                ? `${selectedFiles.length} Files`
                : "File"}
            </>
          )}
        </button>
      </div>

      {/* Attachments List */}
      <div className="attachments-list">
        <h4 className="list-title">
          Uploaded Files {attachments && `(${attachments.length})`}
        </h4>

        {isLoadingAttachments ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Loading attachments...</p>
          </div>
        ) : attachments?.length === 0 ? (
          <div className="empty-state">
            <p>📭 No attachments uploaded yet</p>
            <p className="empty-hint">
              Upload medical documents, X-rays, or lab results for this visit
            </p>
          </div>
        ) : (
          <ul className="attachment-items">
            {attachments?.map((attachment) => (
              <li key={attachment.id} className="attachment-item">
                <div className="attachment-info">
                  <span className="file-icon">
                    {getFileIcon(attachment.fileType)}
                  </span>
                  <div className="attachment-details">
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/${attachment.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-name"
                    >
                      {attachment.fileName}
                    </a>
                    <span className="attachment-meta">
                      {new Date(attachment.createdAt).toLocaleString()} ·
                      {attachment.fileType.split("/")[1]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="delete-button"
                  disabled={deleteMutation.isLoading}
                  title="Delete attachment"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VisitAttachmentUpload;
