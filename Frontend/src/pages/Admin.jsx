import React, { useState } from "react";
import Sidebar from "../components/admin/Sidebar";
import BlogForm from "../components/admin/BlogForm";
import BlogCard from "../components/admin/BlogCard";
import ClinicManagement from "../components/admin/ClinicManagement";

const initialBlogs = [
  {
    id: 1,
    title: "5 Essential Tips for a Healthier Lifestyle",
    desc: "Discover simple yet powerful daily practices that can transform your health...",
    img: "https://lh3.googleusercontent.com/aida-C138uK2aI1sCqpCSE2FMkN85RjHyEqNGJILvRZ-jH7uuJxnJpObmevy6GO4YWSAe_pJqOkurZusj47qmGFVann2RKNC-c6wbAt1DMEmSAiM-53qk8QpLsbrPSAIBGGOqDyJ7tST4u2U8YHJgmQcC5rfpuP1EzOggalOaD5OmRU9moQta5SBajE7xs6Z9Ayvhoxnopjsgh6pRmmopt8I8OnojqK_0aeljuO5T_U1ecjmCyJoVtIee_ueWKVglBQ2Rc3ld-DFf6dNcc",
    category: "Wellness Tips",
    readTime: "5 min read",
    date: "March 15, 2024",
    author: "Dr. Sarah Johnson",
    featured: true,
  },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("Clinic Management");
  const [blogs, setBlogs] = useState(initialBlogs);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    img: "",
    category: "",
    readTime: "",
    date: "",
    author: "",
    featured: false,
  });

  const menuItems = ["Clinic Management", "Content Management"];

  const handleSelectMenu = (item) => {
    setActiveTab(item);
  };

  const handleAddOrUpdate = () => {
    if (editingBlog) {
      setBlogs(
        blogs.map((b) => (b.id === editingBlog.id ? { ...b, ...formData } : b))
      );
      setEditingBlog(null);
    } else {
      setBlogs([...blogs, { id: Date.now(), ...formData }]);
    }
    setFormData({
      title: "",
      desc: "",
      img: "",
      category: "",
      readTime: "",
      date: "",
      author: "",
      featured: false,
    });
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({ ...blog });
  };

  const handleDelete = (id) => {
    setBlogs(blogs.filter((b) => b.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeTab}
        onSelect={handleSelectMenu}
      />

      <main className="flex-1 p-8">
        {activeTab === "Clinic Management" && <ClinicManagement />}
        {activeTab === "Content Management" && (
          <>
            <BlogForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddOrUpdate}
              editing={editingBlog}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
