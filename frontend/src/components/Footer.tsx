import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-auto border-t border-indigo-100 dark:border-slate-800/50 bg-transparent dark:bg-slate-900/50 backdrop-blur-sm py-8 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">© 2026 Athena Systems. Crafted with 💙 for the team.</p>
            </div>
        </footer>
    );
};

export default Footer;
