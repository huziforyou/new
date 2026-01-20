import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaGoogleDrive, FaSearch, FaBars } from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
import { IoMdImages } from "react-icons/io";

const ImagesByEmails = () => {
    const location = useLocation();
    const { user } = useUser();
    const navigate = useNavigate();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile responsiveness

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, { withCredentials: true });
                const fetchedEmails = res.data;
                setEmails(fetchedEmails);

                // If at root path and we have emails, redirect to the first one
                if (location.pathname.endsWith('/ImagesByEmails') && fetchedEmails.length > 0) {
                    navigate(fetchedEmails[0].email);
                }
            } catch (error) {
                console.error("Failed to fetch image sources", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);

    const filteredEmails = emails.filter(emailObj =>
        emailObj.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50 dark:bg-zinc-900">
            {/* Sidebar Toggle (Mobile) */}
            <div className="md:hidden p-4 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Select Email</span>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <FaBars />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-20 w-full md:w-80 h-full bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 shadow-lg md:shadow-none transition-transform duration-300 ease-in-out flex flex-col`}>

                {/* Search Header */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <IoMdImages className="text-blue-500" /> Sources
                    </h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-zinc-900 border-none text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading sources...</div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No emails found.</div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                            {filteredEmails.map((emailObj) => {
                                const isActive = location.pathname.includes(emailObj.email);
                                const isMyEmail = emailObj.email.toLowerCase() === user?.email?.toLowerCase();

                                return (
                                    <div key={emailObj._id} className={`group flex flex-col p-3 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-zinc-700/30 border-l-4 border-transparent'}`}>
                                        <Link
                                            to={emailObj.email}
                                            onClick={() => setIsSidebarOpen(false)} // Close on mobile click
                                            className="block mb-2"
                                        >
                                            <p className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {emailObj.email}
                                            </p>
                                        </Link>

                                        {/* Sync Button (Only if it's my email) */}
                                        {isMyEmail && (
                                            <a
                                                href={`${import.meta.env.VITE_BASE_URL}/auth/google`}
                                                className="self-start inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors"
                                                title="Sync images from your Google Drive"
                                            >
                                                <FaGoogleDrive /> Sync Now
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Instructions */}
                <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 text-xs text-gray-500 border-t border-gray-100 dark:border-zinc-700">
                    <p>Select an email to view its gallery.</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative w-full h-full bg-slate-50 dark:bg-zinc-950">
                <Outlet />
            </div>
        </div>
    );
};

export default ImagesByEmails;