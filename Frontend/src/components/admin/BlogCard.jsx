import React from "react";

export default function BlogCard({ blog, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between">
      <img
        src={blog.img}
        alt={blog.title}
        className="w-full h-48 object-cover rounded mb-2"
      />
      <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-100">
        {blog.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
        {blog.desc}
      </p>
      <div className="flex justify-between items-center mt-auto">
        <button
          onClick={() => onEdit(blog)}
          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(blog.id)}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
