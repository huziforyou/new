import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { IoMdTrash, IoMdAdd, IoMdMail } from "react-icons/io";
import toast from 'react-hot-toast';
import { useUser } from '../Context/UserContext';

const MailManagement = () => {
    const { token } = useUser();
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setEmails(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch emails');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchEmails();
    }, [token]);

    const handleAddEmail = async (e) => {
        e.preventDefault();
        if (!newEmail) return;

        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, { email: newEmail }, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            toast.success('Email added successfully');
            setNewEmail('');
            fetchEmails();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to add email');
        }
    };

    const handleDeleteEmail = async (id) => {
        if (!window.confirm('Are you sure you want to delete this email?')) return;

        try {
            await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/image-sources/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            toast.success('Email removed successfully');
            fetchEmails();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete email');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <IoMdMail className="text-blue-500" /> Mail Management
            </h1>

            {/* Add New Email Form */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Add New Source Email</h2>
                <form onSubmit={handleAddEmail} className="flex gap-4 items-center">
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter email address (e.g., example@gmail.com)"
                        className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 transition-colors"
                    >
                        <IoMdAdd size={20} /> Add Email
                    </button>
                </form>
            </div>

            {/* Email List */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200">Authorized Emails</h2>
                </div>

                {loading && emails.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : emails.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No emails found. Add one above.</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                        {emails.map((item) => (
                            <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">Added {new Date(item.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <p className="text-xs text-gray-400 cursor-help">How to sync?</p>
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            To see images from this email, the owner ({item.email}) must log in and click "Sync Drive".
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEmail(item._id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete Email"
                                    >
                                        <IoMdTrash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sync Information / Global Action */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Sync Instructions</h2>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                    For images to appear on the map, the system needs to fetch them from Google Drive.
                    If you are the owner of one of the allowed emails, click the button below to sync your drive now.
                </p>
                <a
                    href={`${import.meta.env.VITE_BASE_URL}/auth/google`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <IoMdMail /> Sync My Google Drive
                </a>
            </div>
        </div>
    );
};

export default MailManagement;
