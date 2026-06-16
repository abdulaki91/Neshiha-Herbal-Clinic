import React, { useState, useEffect } from "react";

export default function BlogForm({ formData, setFormData, onSubmit, editing }) {
  const [mediaType, setMediaType] = useState("image");
  const [preview, setPreview] = useState("");

  // Update preview when img changes
  useEffect(() => {
    if (formData.img) {
      const objectUrl = URL.createObjectURL(formData.img);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview("");
    }
  }, [formData.img]);

  const handleChange = (e) => {
    const { name, type, checked, files, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    setFormData((prev) => ({ ...prev, img: null }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h1 className="text-3xl font-bold mb-6">
        {editing ? "Edit Post" : "Add New Post"}
      </h1>

      <input
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Title"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="mb-2">
        <label className="mr-4 font-medium text-gray-700 dark:text-gray-200">
          Media Type:
        </label>
        <label className="mr-2">
          <input
            type="radio"
            value="image"
            checked={mediaType === "image"}
            onChange={handleMediaTypeChange}
            className="mr-1"
          />
          Image
        </label>
        <label>
          <input
            type="radio"
            value="video"
            checked={mediaType === "video"}
            onChange={handleMediaTypeChange}
            className="mr-1"
          />
          Video
        </label>
      </div>

      <input
        type="file"
        name="img"
        accept={mediaType === "image" ? "image/*" : "video/*"}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {preview && mediaType === "image" && (
        <img src={preview} alt="preview" className="mb-2 max-h-48 rounded" />
      )}

      {preview && mediaType === "video" && (
        <video controls className="mb-2 max-h-48 rounded">
          <source src={preview} type={formData.img.type} />
        </video>
      )}

      <input
        name="author"
        value={formData.author}
        onChange={handleChange}
        placeholder="Author"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <textarea
        name="desc"
        value={formData.desc}
        onChange={handleChange}
        placeholder="Description"
        className="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <button
        onClick={onSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {editing ? "Save Changes" : "Add Post"}
      </button>
    </div>
  );
}
