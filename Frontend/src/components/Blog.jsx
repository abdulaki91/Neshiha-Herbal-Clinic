import React, { useState } from "react";

const posts = [
  {
    title: "5 Essential Tips for a Healthier Lifestyle",
    desc: "Discover simple yet powerful daily practices that can transform your health and well-being naturally. From morning routines to evening habits, learn how small changes create lasting results.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC138uK2aI1sCqpCSE2FMkN85RjHyEqNGJILvRZ-jH7uuJxnJpObmevy6GO4YWSAe_pJqOkurZusj47qmGFVann2RKNC-c6wbAt1DMEmSAiM-53qk8QpLsbrPSAIBGGOqDyJ7tST4u2U8YHJgmQcC5rfpuP1EzOggalOaD5OmRU9moQta5SBajE7xs6Z9Ayvhoxnopjsgh6pRmmopt8I8OnojqK_0aeljuO5T_U1ecjmCyJoVtIee_ueWKVglBQ2Rc3ld-DFf6dNcc",
    category: "Wellness Tips",
    readTime: "5 min read",
    date: "March 15, 2024",
    author: "Dr. Sarah Johnson",
    featured: true
  },
  {
    title: "The Healing Power of Herbal Medicine",
    desc: "Explore the ancient wisdom of herbal medicine and discover how natural remedies can enhance your health. Learn about the science behind traditional healing practices and modern applications.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAA6xVmRAHci1ywBmNsoG2WjQwqV7HaVPmfuoM0q_1TrHtDF_995VxOEOgPW-3XlA-BipOlP2bIk4RdFStO9RAHGNmQvpb6HyNYKcbP6naKimk6LlqsvY95pGrgk0CUFLhGrtl-T5W1YQx0MkSEMi5RTG6SxSYTHWcTk70YZK6g7PXn6AIG_sX0WMnsL1tAJiZ8Ubw23QmF8iHAhbVM-3bgXh_qRPyQV1RE5TQ_HVKpKV9u04Ivl3T0lXla53_LlReefFCtvLgHUpg",
    category: "Herbal Medicine",
    readTime: "7 min read",
    date: "March 12, 2024",
    author: "Dr. Ahmed Hassan",
    featured: false
  },
  {
    title: "Natural Detox: Cleanse Your Body Naturally",
    desc: "Learn about natural detoxification methods that support your body's natural cleansing processes. Discover herbs, foods, and practices that promote optimal health and vitality.",
    img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
    category: "Detox & Cleansing",
    readTime: "6 min read",
    date: "March 10, 2024",
    author: "Dr. Maria Rodriguez",
    featured: false
  },
  {
    title: "Stress Management Through Traditional Healing",
    desc: "Explore ancient stress management techniques and how they can help you find balance in today's fast-paced world. From meditation to herbal remedies, discover natural stress relief.",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: "Mental Health",
    readTime: "8 min read",
    date: "March 8, 2024",
    author: "Dr. James Chen",
    featured: false
  },
  {
    title: "Seasonal Wellness: Spring Health Guide",
    desc: "Embrace the energy of spring with our comprehensive guide to seasonal wellness. Learn how to align your health practices with nature's rhythms for optimal vitality.",
    img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop",
    category: "Seasonal Health",
    readTime: "4 min read",
    date: "March 5, 2024",
    author: "Dr. Elena Petrov",
    featured: false
  },
  {
    title: "The Science Behind Natural Immunity",
    desc: "Understand how natural remedies and lifestyle choices can strengthen your immune system. Discover evidence-based approaches to building robust health naturally.",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    category: "Immunity",
    readTime: "9 min read",
    date: "March 3, 2024",
    author: "Dr. Lisa Thompson",
    featured: false
  }
];

/** Blog Section */
export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const categories = ["All", "Wellness Tips", "Herbal Medicine", "Detox & Cleansing", "Mental Health", "Seasonal Health", "Immunity"];
  
  const filteredPosts = selectedCategory === "All" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <section id="blog" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-200/50 shadow-lg mb-8">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Our Blog</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-teal-600 bg-clip-text text-transparent mb-8">
            Wellness Insights
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Discover expert insights, natural health tips, and the latest research in herbal medicine 
            to support your journey to optimal wellness.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {filteredPosts.filter(post => post.featured).map((post, i) => (
          <div key={i} className="mb-16">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden group hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-2">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Featured Image */}
                <div className="relative overflow-hidden">
                  <div
                    className="aspect-[4/3] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${post.img})` }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Featured
                    </span>
                  </div>
                </div>
                
                {/* Featured Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-sm">{post.readTime}</span>
                  </div>
                  
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4 group-hover:text-emerald-700 transition-colors duration-300">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {post.desc}
                  </p>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{post.author}</p>
                        <p className="text-sm text-gray-500">{post.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Read Full Article
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.filter(post => !post.featured).map((post, i) => (
            <div key={i} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
              {/* Post Image */}
              <div className="relative overflow-hidden">
                <div
                  className="aspect-[4/3] bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${post.img})` }}
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                    {post.category}
                  </span>
                </div>
              </div>
              
              {/* Post Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-500 text-sm">{post.readTime}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 text-sm">{post.date}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-emerald-700 transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.desc}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{post.author}</span>
                  </div>
                  
                  <button className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
                    Read More →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 rounded-3xl p-16 text-white shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-4xl lg:text-5xl font-bold mb-6">
                Stay Updated
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Get the latest wellness tips, herbal medicine insights, and health updates delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg"
                />
                <button className="bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-900 font-bold px-8 py-4 rounded-2xl hover:from-emerald-300 hover:to-teal-300 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
