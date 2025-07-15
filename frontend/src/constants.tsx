
import React from 'react';
import { FAQItem } from './types';

// Tooltip Component
export const Tooltip: React.FC<{text: string, children: React.ReactNode}> = ({ text, children }) => {
  const [visible, setVisible] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <div 
      ref={triggerRef}
      className="relative flex items-center" 
      onMouseEnter={showTooltip} 
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible && (
        <div 
          role="tooltip"
          className="absolute left-full ml-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg z-20 transition-opacity duration-200"
        >
          {text}
        </div>
      )}
    </div>
  );
};

// Data Constants
export const BOOK_GENRES = [
  "General Fiction", "Science Fiction", "Fantasy", "Mystery", "Thriller", "Romance", 
  "Historical Fiction", "Horror", "Biography", "Autobiography", "Self-Help", 
  "Philosophy", "Science", "History", "Business", "Comics & Graphic Novels", 
  "Children's", "Young Adult", "Other"
];

export const BOOK_LANGUAGES = ["English", "Spanish", "French", "German", "Hindi", "Mandarin", "Other"];

export const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I borrow a book?",
    answer: "Navigate to the 'Community Books' tab, find a book you like that is marked as 'Available', and click the 'Request Book' button. The owner will be notified of your request."
  },
  {
    question: "What happens after I request a book?",
    answer: "The book's owner will be notified. They can approve or reject your request. If they approve, you will be notified, and you can then coordinate a pickup time and place with the owner, typically through your community's existing communication channels like MyGate or Intercom, or using the in-app chat feature."
  },
  {
    question: "What is the typical borrowing period?",
    answer: "The standard borrowing period is 15 days. Please be considerate and return the book on time so others can enjoy it. If you need more time, please communicate with the book owner."
  },
  {
    question: "How do I add my own books to share?",
    answer: "Go to the 'My Library' tab and click on 'Add a New Book'. You can search for the book online to auto-fill details or enter them manually. A cover image is required."
  },
  {
    question: "What is the difference between a normal loan and a 'giveaway'?",
    answer: "A normal loan is like a library book - you are expected to return it. A book marked as a 'giveaway' is a gift from the owner to another community member; you do not need to return it."
  },
  {
    question: "How do I report an issue with a book or user?",
    answer: "On each book card in the community view, there is a 'Report Book' button for issues with the listing. For user-related issues or other problems, please use the 'Submit Feedback' option in your user menu."
  },
  {
    question: "Why can't I request a book? The button is disabled.",
    answer: "You may have reached your limit of 5 active requests and borrowed books. To request a new book, one of your current borrowed books must be marked as returned by its owner."
  }
];

// SVG Icons

export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6-2.292m0 0V3.75m0 16.5A8.966 8.966 0 0 1 12 18c-2.305 0-4.408.867-6 2.292m0 0V3.75" />
  </svg>
);

export const DefaultBookIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-12 h-12"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6-2.292m0 0V3.75m0 16.5A8.966 8.966 0 0 1 12 18c-2.305 0-4.408.867-6 2.292m0 0V3.75" />
  </svg>
);

export const UserPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 19.5h16.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.25 4.5H3.75A2.25 2.25 0 0 0 1.5 6.75v10.5A2.25 2.25 0 0 0 3.75 19.5Z" />
  </svg>
);

export const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ArrowRightOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
</svg>
);

export const ArrowRightStartOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0H3" />
  </svg>
);

export const ArrowLeftOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
</svg>
);

export const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

export const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-1.152 3 3 0 0 0-3.741 1.153 9.094 9.094 0 0 0 3.741.479ZM12 15a9.094 9.094 0 0 0-3.741.479 3 3 0 0 0-3.741-1.153 3 3 0 0 0-3.741 1.153A9.094 9.094 0 0 0 12 15Zm-6.741-.479A3 3 0 0 0 4.5 12.55a3 3 0 0 0-1.259.47M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.741-.479A3 3 0 0 0 19.5 12.55a3 3 0 0 0-1.259.47" />
  </svg>
);

export const ArrowRightCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const HandRaisedIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
  </svg>
);

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const LibraryIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
 </svg>
);

export const ArrowUturnLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);

export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.017 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

export const HandThumbUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.424 2.002-1.116A4.503 4.503 0 0 1 12 6.75c1.472 0 2.802.726 3.647 1.92s1.243 2.602 1.243 4.03c0 .307-.024.607-.072.902C16.696 14.857 15.053 15.75 13.06 15.75c-.71 0-1.38-.137-1.996-.402L9.58 16.521A6.75 6.75 0 0 1 9 18.336a11.217 11.217 0 0 1-2.367-.323c-.3-.075-.589-.187-.866-.328V10.25Zm0 0V7.5A2.25 2.25 0 0 1 8.883 5.25c.348-.042.695-.069 1.05-.084l.51-.016a7.53 7.53 0 0 1 1.004.031c1.464.175 2.657 1.43 2.657 2.937 0 .34-.035.668-.102.984-.22.924-1.042 1.7-2.028 1.954C13.1 11.396 12.502 11.25 12 11.25c-.75 0-1.5.15-2.25.45l-.75.3c-.503.2-1.05.293-1.617.293H6.634Z" />
  </svg>
);

export const HandThumbDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25H4.875c-.94 0-1.802.543-2.206 1.396C2.268 12.478 2.25 13.243 2.25 14.018v.284c0 .488.06.969.178 1.431L2.83 17.5c.322 1.013 1.254 1.75 2.34 1.75h9.45c.986 0 1.838-.633 2.219-1.528l.332-.792a4.498 4.498 0 0 0 .142-2.14c0-1.044-.543-1.983-1.366-2.58l-1.04-.778A4.5 4.5 0 0 0 13.5 9.75c-.748 0-1.455.195-2.083.543-.728.39-1.536.502-2.316.345A6.75 6.75 0 0 0 6.633 10.25Zm0 0V7.5a2.25 2.25 0 0 1 2.25-2.25M6.633 10.25a11.217 11.217 0 0 1 2.367.323c.3.075.589.187.866.328m0 0V13.5c0 .75.6 1.35 1.35 1.35h.068c.553 0 1.071-.303 1.32-.78S13.5 13.11 13.5 12.57v-.293c0-.704.184-1.385.518-1.973l.25-.453A2.25 2.25 0 0 1 16.5 9c.39 0 .762.131 1.048.368.14.116.27.243.389.378M9.866 10.978A4.5 4.5 0 0 0 7.5 9.167c-.895 0-1.748.29-2.436.804" />
  </svg>
);

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const InboxStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M2.25 9h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512A2.25 2.25 0 0 0 10.39 12h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M2.25 4.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512A2.25 2.25 0 0 0 10.39 7.5h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859" />
  </svg>
);

export const CheckBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

export const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.03 3.22.077m3.908 0c-1.153 0-2.24-.03-3.22-.077m7.874 0-4.226 6.339M12 2.25 9.872 5.79m2.128-3.54L9.872 5.79" />
  </svg>
);

export const PhotoIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm1.5-6a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
);

export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

export const HomeModernIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 3.545A2.25 2.25 0 0 1 15 2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v17.25h-4.5M8.25 3.545A2.25 2.25 0 0 0 6 2.25H4.5a2.25 2.25 0 0 0-2.25 2.25v17.25H6.75m0-17.25h1.5" />
  </svg>
);

export const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

export const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ChatBubbleLeftEllipsisIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

export const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v2.25m0-10.5v1.077c0 .411-.14.801-.39 1.118l-3.333 4.084a.678.678 0 0 1-1.017.069l-3.333-2.5a.678.678 0 0 0-1.017.069l-3.333 2.5a.678.678 0 0 1-1.017-.069L3.39 8.445A1.875 1.875 0 0 1 3 7.328V6.25m18 5v2.25m0-10.5v1.077c0 .411-.14.801-.39 1.118l-3.333 4.084a.678.678 0 0 1-1.017.069l-3.333-2.5a.678.678 0 0 0-1.017.069l-3.333 2.5a.678.678 0 0 1-1.017-.069L3.39 8.445A1.875 1.875 0 0 1 3 7.328V6.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591" />
  </svg>
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0l-3.181 3.183" />
  </svg>
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.443-6.11a1.012 1.012 0 0 1 1.638-.01l.243.352a1.012 1.012 0 0 0 1.638-.01l.243-.352a1.012 1.012 0 0 1 1.638-.01l4.443 6.11a1.012 1.012 0 0 1 0 .639l-4.443 6.11a1.012 1.012 0 0 1-1.638.01l-.243-.352a1.012 1.012 0 0 0-1.638.01l-.243.352a1.012 1.012 0 0 1-1.638.01l-4.443-6.11Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const EyeSlashIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.524M4.223 4.223 19.777 19.777" />
  </svg>
);

export const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

export const FlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 4.5" />
  </svg>
);

export const ShieldExclamationIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const UserCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const HeartIcon: React.FC<React.SVGProps<SVGSVGElement> & { solid?: boolean }> = ({ className, solid, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={solid ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

export const ChatBubbleOvalLeftEllipsisIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v8.519Z" />
  </svg>
);

export const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Zm.375-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm-3-3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
  </svg>
);

export const PencilSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
