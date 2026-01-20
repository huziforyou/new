import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaGoogleDrive } from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext';
// import { allowedEmails } from '../../utils/allowedEmail'; // Replaced by dynamic check

const ImagesByEmails = () => {
    const location = useLocation()
    const { user } = useUser()
    const navigate = useNavigate()
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/image-sources`, { withCredentials: true });
                const fetchedEmails = res.data;
                setEmails(fetchedEmails);

                // Navigate to the first email if at root of ImagesByEmails and emails exist
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

    // Check if current user is allowed to sync (client-side check for UI button)
    const isAllowedToSync = emails.some(e => e.email.toLowerCase() === user.email.toLowerCase());

    return (
        <div className="flex flex-col px-4 pt-4 w-full">
            <div className=' flex lg:flex-row flex-col-reverse items-center justify-between gap-6 p-4 w-full  border-b-[3px] dark:border-zinc-800 border-gray-100 text-gray-700 dark:text-gray-200 '>
                <div className='flex items-center gap-4 lg:text-lg text-sm lg:text-end text-center flex-wrap justify-center lg:justify-start'>
                    {loading ? (
                        <span>Loading sources...</span>
                    ) : (
                        emails.map((emailObj) => (
                            <Link
                                key={emailObj._id}
                                className={`${location.pathname.includes(emailObj.email) ? 'dark:text-gray-100 text-zinc-800 font-bold border-b-2 border-blue-500' : 'text-gray-500'}`}
                                to={emailObj.email}
                            >
                                {emailObj.email}
                            </Link>
                        ))
                    )}
                </div>
                {
                    isAllowedToSync && (
                        <Link to={`${import.meta.env.VITE_BASE_URL}/auth/google`} className='flex items-center justify-center gap-3 px-2 py-2 rounded border-2 w-fit dark:border-white border-zinc-800 uppercase hover:bg-gray-100/10 transition-all ease-in 100 '>
                            <FaGoogleDrive /> Get Images From Google Drive
                        </Link>
                    )
                }
            </div>

            <div>
                <Outlet />
            </div>
        </div>
    )
}

export default ImagesByEmails