import React, { useState } from "react";

const UserProfileSidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 left-6 z-[100] px-4 py-2 rounded-lg bg-sky-400 text-[#001a2e] font-semibold shadow-lg"
      >
        {open ? "Hide Profile" : "Show Profile"}
      </button>

      <aside
        className={`fixed top-0 left-0 z-[99] h-screen w-80 bg-[#0b1020] border-r border-white/10 text-white p-6 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 mt-16">
          <h2 className="text-2xl font-bold">Your Profile</h2>
          <p className="text-sm text-white/50 mt-1">
            Fill in your personal info
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              Username
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              Bio
            </label>
            <textarea
              rows="4"
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none resize-none"
              placeholder="Tell us about yourself"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              Favorite Genre
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none"
              placeholder="Drama, Sci-Fi, Thriller..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white/80">
              Location
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none"
              placeholder="City, Country"
            />
          </div>

          <button className="mt-4 py-3 rounded-lg font-semibold bg-sky-400 text-[#001a2e] hover:opacity-90">
            Save Profile
          </button>
        </div>
      </aside>
    </>
  );
};

export default UserProfileSidebar;