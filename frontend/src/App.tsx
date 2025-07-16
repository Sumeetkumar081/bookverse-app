
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Book, Notification, View, OverdueInfo, Feedback, FeedbackStatus, AdminSubView, ChatSession, ChatMessage, AppButtonProps, GoogleBookSearchResult, MyLibrarySubView, PaginatedBooksResponse, KpiData } from './types';
import { apiService } from './services/apiService';
import BookCard from './components/BookCard';
import { 
  BookOpenIcon, UserPlusIcon, UsersIcon, 
  HomeIcon, LibraryIcon, ArrowLeftOnRectangleIcon, BellIcon,
  ClockIcon, XCircleIcon, CheckCircleIcon,
  InboxStackIcon, EnvelopeIcon, CheckBadgeIcon, ArrowUturnLeftIcon, UserCircleIcon, 
  PhotoIcon, MagnifyingGlassIcon, InformationCircleIcon, SparklesIcon,
  PhoneIcon, ShieldCheckIcon, ChatBubbleLeftEllipsisIcon, ChevronDownIcon, ChevronUpIcon,
  GiftIcon, BOOK_GENRES, BOOK_LANGUAGES, ArrowPathIcon, EyeIcon, EyeSlashIcon, QuestionMarkCircleIcon,
  FAQ_DATA, HandRaisedIcon, FlagIcon, ShieldExclamationIcon, UserCheckIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon,
  ArrowRightCircleIcon, ArrowDownCircleIcon, ArrowRightStartOnRectangleIcon, DefaultBookIcon, Tooltip,
  ArrowLeftIcon
} from './constants'; 

type AuthMode = 'login' | 'register';
const CHAT_MESSAGE_MAX_LENGTH = 280;
const ITEMS_PER_PAGE = 10;
const REQUEST_LIMIT = 5;


// AppButtonProps moved to types.ts
const AppButton: React.FC<AppButtonProps> = ({ children, variant = 'primary', fullWidth = false, icon, className, size = 'md', flex1, ...props }) => {
  let baseStyle = "font-semibold rounded-md transition-all duration-200 ease-in-out flex items-center justify-center shadow-sm hover:shadow-md transform hover:scale-102.5 focus:outline-none focus:ring-2 focus:ring-offset-2";
  if (size === 'sm') baseStyle += " py-1 px-2.5 text-xs";
  else if (size === 'lg') baseStyle += " py-2.5 px-5 text-base";
  else baseStyle += " py-2 px-3.5 text-sm";

  if (fullWidth) baseStyle += " w-full";
  if (flex1) baseStyle += " flex-1";

  if (variant === 'primary') baseStyle += " bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-400";
  else if (variant === 'secondary') baseStyle += " bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400 border border-slate-300";
  else if (variant === 'danger') baseStyle += " bg-red-600 text-white hover:bg-red-700 focus:ring-red-400";
  else if (variant === 'confirm') baseStyle += " bg-green-600 text-white hover:bg-green-700 focus:ring-green-400";
  
  return <button className={`${baseStyle} ${className || ''}`} {...props}>{icon}{children}</button>;
};

interface RegistrationPrecondition {
  id: string;
  text: string;
  checked: boolean;
}

const initialRegistrationPreconditions: RegistrationPrecondition[] = [
  { id: 'beta', text: "I understand this is a beta application and the developer is not liable for any loss or damage of books.", checked: false },
  { id: 'goodwill', text: "I agree to maintain community goodwill by keeping borrowed books in good condition and returning them within a reasonable timeframe (typically 15 days).", checked: false },
  { id: 'noLiability', text: "I acknowledge this platform is a facilitator for book sharing. The developer bears no responsibility for transactions, disputes, or the condition of books.", checked: false },
  { id: 'communication', text: "I agree to use community communication channels (e.g., MyGate, Intercom, or In-App Messaging) respectfully for coordinating book exchanges.", checked: false },
];

// Helper Component Definitions

interface AuthInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  clearError: () => void;
  children?: React.ReactNode; // For password toggle
}
const AuthInput: React.FC<AuthInputProps> = ({ id, label, value, onChange, error, placeholder, type = 'text', maxLength, clearError, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => { onChange(e.target.value); if (error) clearError(); }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm ${error ? 'border-red-500 ring-red-300' : 'border-gray-300'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {children}
    </div>
    {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'confirm'; 
}
const AuthButton: React.FC<AuthButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseStyle = "w-full font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md py-3 px-4 text-sm";
  let variantStyle = "";
  if (variant === 'primary') variantStyle = "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-400";
  else if (variant === 'confirm') variantStyle = "bg-green-600 text-white hover:bg-green-700 focus:ring-green-400";
  return <button className={`${baseStyle} ${variantStyle}`} {...props}>{children}</button>;
};

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  clearError: () => void;
  maxLength?: number;
}
const FormInput: React.FC<FormInputProps> = ({ id, label, value, onChange, error, placeholder, type = 'text', clearError, maxLength }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => { onChange(e.target.value); if (error) clearError(); }}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm ${error ? 'border-red-500 ring-red-300' : 'border-gray-300'}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

interface FormInputAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
  clearError: () => void;
  maxLength?: number;
  showCharCount?: boolean;
  className?: string;
}
const FormInputArea: React.FC<FormInputAreaProps> = ({ id, label, value, onChange, error, placeholder, rows = 3, clearError, maxLength, showCharCount, className }) => (
  <div className={className}>
    <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}:</label>
        {maxLength && showCharCount && (
            <span className={`text-xs ${value.length > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
                {value.length}/{maxLength}
            </span>
        )}
    </div>
    <textarea
      id={id}
      value={value}
      onChange={(e) => { onChange(e.target.value); if (error) clearError(); }}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm ${error ? 'border-red-500 ring-red-300' : 'border-gray-300'}`}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  isCompact?: boolean;
}
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, isCompact }) => (
  <div className={`text-center p-4 ${isCompact ? 'py-6' : 'py-10'} bg-slate-50 rounded-lg border border-dashed border-slate-300`}>
    {icon && <div className="flex justify-center mb-3 text-slate-400">{React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: "w-10 h-10" })}</div>}
    <h3 className={`font-semibold ${isCompact ? 'text-lg text-slate-600' : 'text-xl text-slate-700'} mb-1`}>{title}</h3>
    <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-slate-500`}>{message}</p>
  </div>
);

interface MyActivitySectionProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    books: Book[];
    currentUser: User;
    getUserById: (userId?: string) => User | undefined;
    onShowBookDetails: (bookId: string) => void;
    AppButtonComponent: React.FC<AppButtonProps>;
    onMagnifyImage: (imageUrl: string) => void;
    calculateOverdueInfo?: (pickupTimestamp?: number) => OverdueInfo | undefined;
    onConfirmPickup?: (bookId: string) => void;
    onCancelRequest?: (bookId: string) => void;
    onInitiateChat?: (otherUserId: string) => void;
    onApproveRequest?: (bookId: string) => void;
    onRejectRequest?: (bookId: string) => void;
    onRevokeApproval?: (bookId: string) => void;
    onMarkAsReturned?: (bookId: string) => void;
    onRemindBorrower?: (bookId: string, borrowerId: string) => void;
    showOwnerDetails?: boolean;
}
const MyActivitySection: React.FC<MyActivitySectionProps> = ({
    title, count, icon, books: sectionBooks, currentUser, getUserById, calculateOverdueInfo,
    onConfirmPickup, onCancelRequest, onShowBookDetails, onInitiateChat, AppButtonComponent, onMagnifyImage,
    onApproveRequest, onRejectRequest, onRevokeApproval, onMarkAsReturned, onRemindBorrower, showOwnerDetails
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <section className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left font-bold text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 mb-4 hover:opacity-80 transition-opacity"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: "w-6 h-6 mr-2" })}
                    {title} ({count})
                </span>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-500" /> : <ChevronDownIcon className="w-5 h-5 text-slate-500" />}
            </button>
            {isOpen && (
                count > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {sectionBooks.map(book => (
                            <BookCard
                                key={book.id}
                                book={book}
                                owner={getUserById(book.ownerId)}
                                borrower={getUserById(book.borrowedByUserId)}
                                requester={getUserById(book.requestedByUserId)}
                                currentUser={currentUser}
                                onConfirmPickup={onConfirmPickup || (()=>{})}
                                onCancelRequest={onCancelRequest}
                                onShowBookDetails={onShowBookDetails}
                                onMagnifyImage={onMagnifyImage}
                                onInitiateChat={onInitiateChat}
                                overdueInfo={calculateOverdueInfo ? calculateOverdueInfo(book.pickupTimestamp) : undefined}
                                viewContext="myActivityAndOutgoing"
                                onrequestbook={()=>{}}
                                onMarkAsReturned={onMarkAsReturned || (()=>{})}
                                onApproveRequest={onApproveRequest || (()=>{})}
                                onRejectRequest={onRejectRequest || (()=>{})}
                                onRevokeApproval={onRevokeApproval}
                                onRemindBorrower={onRemindBorrower}
                                isCompactView={true}
                                AppButtonComponent={AppButtonComponent}
                                showOwnerDetailsInCard={showOwnerDetails}
                            />
                        ))}
                    </div>
                ) : <EmptyState icon={<InboxStackIcon />} title={`No books in this section.`} message="All clear here!" isCompact />
            )}
        </section>
    );
};

interface AlertToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: (id: string) => void;
}

const AlertToast: React.FC<AlertToastProps> = ({ id, type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [id, onClose]);

  let bgColor, textColor, iconEl;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 border-green-400';
      textColor = 'text-green-800';
      iconEl = <CheckCircleIcon className="w-5 h-5" />;
      break;
    case 'error':
      bgColor = 'bg-red-100 border-red-400';
      textColor = 'text-red-800';
      iconEl = <XCircleIcon className="w-5 h-5" />;
      break;
    default: // info
      bgColor = 'bg-blue-100 border-blue-400';
      textColor = 'text-blue-800';
      iconEl = <InformationCircleIcon className="w-5 h-5" />;
  }

  return (
    <div className={`border-l-4 p-4 my-2 rounded-md shadow-lg ${bgColor} ${textColor} animate-fade-in-down w-full`} role="alert">
      <div className="flex items-center">
        <div className="py-1 mr-3">{iconEl}</div>
        <div className="flex-grow">
          <p className="font-bold text-sm">{message}</p>
        </div>
        <button onClick={() => onClose(id)} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none" aria-label="Dismiss">
          <XCircleIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


interface ReadOnlyInputProps {
  label: string;
  value: string;
}
const ReadOnlyInput: React.FC<ReadOnlyInputProps> = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
    <input
      type="text"
      value={value}
      readOnly
      className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 shadow-sm cursor-not-allowed"
    />
  </div>
);

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}
const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'lg' }) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out" aria-modal="true" role="dialog">
            <div className={`bg-white p-6 rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100" aria-label="Close modal">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div>{children}</div>
            </div>
            <style>{`
                @keyframes modalShow {
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-modalShow {
                    animation: modalShow 0.3s forwards;
                }
            `}</style>
        </div>
    );
};

interface AdminHeaderProps {
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  pendingApprovalsCount: number;
}
const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout, onNavigateToDashboard, pendingApprovalsCount }) => {
  return (
    <header className="bg-white text-slate-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div 
          className="flex items-center text-2xl font-bold cursor-pointer text-indigo-600 hover:opacity-80 transition-opacity"
          onClick={onNavigateToDashboard}
          title="Go to Admin Dashboard Overview"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToDashboard(); }}
        >
          <ShieldCheckIcon className="w-8 h-8 mr-2" />
          <span>BookVerse Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          {pendingApprovalsCount > 0 && (
            <div className="flex items-center text-amber-600">
              <UserPlusIcon className="w-5 h-5 mr-1" />
              <span className="text-sm font-semibold">{pendingApprovalsCount} Pending</span>
            </div>
          )}
          <AppButton 
            variant="secondary" 
            onClick={onLogout} 
            icon={<ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1.5" />}
          >
            Logout
          </AppButton>
        </div>
      </div>
    </header>
  );
};

type ToastNotification = {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length > 7) score++;
  if (password.match(/[a-z]/)) score++;
  if (password.match(/[A-Z]/)) score++;
  if (password.match(/\d/)) score++;
  if (password.match(/[^a-zA-Z\d]/)) score++;
  if (password.length === 0) score = 0;

  const levels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Medium', color: 'bg-yellow-500' },
    { label: 'Medium', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very Strong', color: 'bg-green-500' },
  ];
  return { score, ...levels[score] };
};

const PasswordStrengthMeter: React.FC<{ password?: string }> = ({ password = '' }) => {
  const { score, label, color } = calculatePasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-medium text-gray-600">Password Strength:</span>
        <span className={`font-semibold ${color.replace('bg-', 'text-')}`}>{label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all duration-300`} style={{ width: `${(score / 5) * 100}%` }}></div>
      </div>
    </div>
  );
};

const HowItWorksGuide: React.FC = () => {
  const steps = [
      { icon: <UserPlusIcon className="w-8 h-8"/>, title: "Register", description: "Sign up with your community details." },
      { icon: <UserCheckIcon className="w-8 h-8"/>, title: "Get Approved", description: "Admin verifies your account to ensure community safety." },
      { icon: <LibraryIcon className="w-8 h-8"/>, title: "Share & Browse", description: "Add your books to share and explore what others have." },
      { icon: <HandRaisedIcon className="w-8 h-8"/>, title: "Request a Book", description: "See a book you like? Send a request to the owner." },
      { icon: <ChatBubbleLeftEllipsisIcon className="w-8 h-8"/>, title: "Coordinate", description: "Owner approves, you chat to arrange pickup." },
      { icon: <ArrowUturnLeftIcon className="w-8 h-8"/>, title: "Read & Return", description: "Enjoy the book and return it on time!" },
  ];
  return (
      <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">How BookVerse Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 text-indigo-500 bg-indigo-100 p-3 rounded-full">{step.icon}</div>
                      <div>
                          <h3 className="font-semibold text-slate-800">{step.title}</h3>
                          <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
};

const AdminStatCard: React.FC<{title:string, value: number | string, icon: React.ReactNode, color: string}> = ({title, value, icon, color}) => (
  <div className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
          <div>
              <p className="text-3xl font-bold text-slate-800">{value}</p>
              <p className="text-sm text-slate-500">{title}</p>
          </div>
          <div className="text-slate-400">{icon}</div>
      </div>
  </div>
);

const UserStatusPill: React.FC<{user: User}> = ({user}) => {
  if (user.reactivationRequested) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 animate-pulse">Needs Reactivation</span>;
  if (user.deactivatedByAdmin) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-800">Admin Deactivated</span>;
  if (!user.isActive) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Self Deactivated</span>;
  return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
};

const formatMessageTimestamp = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    return messageDate.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// Main App Component
const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const [currentView, setCurrentView] = useState<View>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [socket, setSocket] = useState<Socket | null>(null);


  // Auth State
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserPhoneNumber, setNewUserPhoneNumber] = useState<string>('');
  const [newUserCommunityUnit, setNewUserCommunityUnit] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserMyGateId, setNewUserMyGateId] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [registrationPreconditions, setRegistrationPreconditions] = useState<RegistrationPrecondition[]>(JSON.parse(JSON.stringify(initialRegistrationPreconditions)));
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);


  // Validation & Form Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [authActionInProgress, setAuthActionInProgress] = useState<boolean>(false);
  const [addBookFormErrors, setAddBookFormErrors] = useState<Record<string, string>>({});
  const [editProfileFormErrors, setEditProfileFormErrors] = useState<Record<string, string>>({});
  const [feedbackFormErrors, setFeedbackFormErrors] = useState<Record<string, string>>({});
  const [editBookFormErrors, setEditBookFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);

  // Book Data State
  const [communityBooksData, setCommunityBooksData] = useState<PaginatedBooksResponse>({ books: [], page: 1, totalPages: 1, totalBooks: 0 });
  const [myCollectionData, setMyCollectionData] = useState<PaginatedBooksResponse>({ books: [], page: 1, totalPages: 1, totalBooks: 0 });
  const [activityBooks, setActivityBooks] = useState<Book[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);


  // Add Book State
  const [addBookMode, setAddBookMode] = useState<'search' | 'manual'>('search');
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  const [bookSearchResults, setBookSearchResults] = useState<GoogleBookSearchResult[]>([]);
  const [isBookSearchLoading, setIsBookSearchLoading] = useState<boolean>(false);
  const [bookSearchError, setBookSearchError] = useState<string | null>(null);
  const [newBookTitle, setNewBookTitle] = useState<string>('');
  const [newBookAuthor, setNewBookAuthor] = useState<string>('');
  const [newBookCoverImage, setNewBookCoverImage] = useState<string | null>(null);
  const [newBookDescription, setNewBookDescription] = useState<string>('');
  const [newBookIsbn, setNewBookIsbn] = useState<string>('');
  const [newBookGenre, setNewBookGenre] = useState<string>(''); 
  const [newBookLanguage, setNewBookLanguage] = useState<string>(''); 
  const [newBookIsGiveaway, setNewBookIsGiveaway] = useState<boolean>(false);

  // Edit Book Modal State
  const [showEditBookModal, setShowEditBookModal] = useState<boolean>(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editBookFormValues, setEditBookFormValues] = useState<Partial<Book>>({});


  // Edit Profile State
  const [editName, setEditName] = useState<string>('');
  const [editEmailOptOut, setEditEmailOptOut] = useState<boolean>(false); 
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState<boolean>(false);
  const [showDeactivateProfileModal, setShowDeactivateProfileModal] = useState<boolean>(false);

  // Forgot/Reset Password State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [emailForReset, setEmailForReset] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [reactivationMessage, setReactivationMessage] = useState<string | null>(null);
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');


  // Community Filters State (for live input)
  const [filterSearchTerm, setFilterSearchTerm] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('available'); 
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all'); 
  const [filterGiveawayOnly, setFilterGiveawayOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('date_desc');
  
  // Community Filters State (for submitted search)
  const [submittedFilters, setSubmittedFilters] = useState({
    term: '',
    availability: 'available',
    genre: 'all',
    language: 'all',
    giveawayOnly: false,
    dateAdded: 'any',
    sortOrder: 'date_desc',
  });
  
  // My Collection Filters State (for live input)
  const [myCollectionSearchTerm, setMyCollectionSearchTerm] = useState<string>('');
  const [myCollectionStatus, setMyCollectionStatus] = useState<'all' | 'available' | 'on_loan' | 'paused'>('all');

  // My Collection Filters State (for submitted search)
  const [submittedMyCollectionFilters, setSubmittedMyCollectionFilters] = useState({
    term: '',
    status: 'all',
  });


  const [communityPage, setCommunityPage] = useState(1);
  const [myCollectionPage, setMyCollectionPage] = useState(1);

  // UI State
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null); 
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);
  const [magnifiedImageUrl, setMagnifiedImageUrl] = useState<string | null>(null);
  const [myLibrarySubView, setMyLibrarySubView] = useState<MyLibrarySubView>('collection');


  // Book Deletion Modal
  const [showDeleteBookModal, setShowDeleteBookModal] = useState<boolean>(false);
  const [bookToDeleteId, setBookToDeleteId] = useState<string | null>(null);

  // Report Book Modal
  const [showReportBookModal, setShowReportBookModal] = useState<boolean>(false);
  const [reportingBookId, setReportingBookId] = useState<string | null>(null);
  const [reportBookReason, setReportBookReason] = useState<string>('');
  const [reportBookError, setReportBookError] = useState<string | null>(null);

  // Book Details Modal State
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [showBookDetailsModal, setShowBookDetailsModal] = useState<boolean>(false);

  // Messaging State
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [chatMessageInput, setChatMessageInput] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatSessionIdRef = useRef<string | null>(null);


  // Feedback State
  const [feedbackSubject, setFeedbackSubject] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Admin State
  const [currentAdminSubView, setCurrentAdminSubView] = useState<AdminSubView>('dashboardHome'); 
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminPendingUsers, setAdminPendingUsers] = useState<User[]>([]);
  const [adminModerationBooks, setAdminModerationBooks] = useState<Book[]>([]);
  const [adminUserFilter, setAdminUserFilter] = useState<string>('');
  const [adminUserActivityFilter, setAdminUserActivityFilter] = useState<'active' | 'all' | 'deactivated' | 'reactivation_requested'>('all');
  const [adminFeedbackFilterStatus, setAdminFeedbackFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [adminContentFilter, setAdminContentFilter] = useState<'reported' | 'deactivated'>('reported');
  const [kpiData, setKpiData] = useState<KpiData | null>(null);

  const isAdminMode = currentUser?.isAdmin || false;

  const createToast = useCallback((message: string, type: ToastNotification['type']) => {
    const newToast: ToastNotification = { id: Date.now().toString(), message, type };
    setToastNotifications(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToastNotifications(prev => prev.filter(t => t.id !== id));
  }, []);

  const getUserById = useCallback((userId?: string): User | undefined => {
    if (!userId) return undefined;
    const allKnownUsers = [...users, ...adminUsers, ...adminPendingUsers];
    return allKnownUsers.find(u => u.id === userId);
  }, [users, adminUsers, adminPendingUsers]);


  const fetchActivityBooks = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !currentUser) return;

    setIsLoading(true);
    try {
        const data = await apiService.searchBooks(token, {
            viewContext: 'activity',
            limit: 500, // Fetch a large number for activity views
            page: 1,
        });
        setActivityBooks(data.books);

        // After fetching books, get all related users to populate cards correctly
        const userIds = new Set<string>();
        data.books.forEach(book => {
            if (book.ownerId) userIds.add(book.ownerId);
            if (book.borrowedByUserId) userIds.add(book.borrowedByUserId);
            if (book.requestedByUserId) userIds.add(book.requestedByUserId);
        });

        // Add current user to make sure their own profile is up to date.
        userIds.add(currentUser.id);

        const uniqueIds = Array.from(userIds);
        if (uniqueIds.length > 0) {
            const fetchedUsers = await apiService.getUsersByIds(token, uniqueIds);
            // Merge new users with existing ones, overwriting to get latest data
            setUsers(prevUsers => {
                const usersMap = new Map(prevUsers.map(u => [u.id, u]));
                fetchedUsers.forEach(u => usersMap.set(u.id, u));
                return Array.from(usersMap.values());
            });
        }

    } catch (error: any) {
        createToast(error.message || "Failed to fetch your activity.", 'error');
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, createToast]);

  const fetchWishlistBooks = useCallback(async () => {
    if (!currentUser?.wishlistBookIds?.length) {
        setWishlistBooks([]);
        return;
    }
    const token = localStorage.getItem('userToken');
    if (!token) return;
    setIsLoading(true);
    try {
        const books = await apiService.getWishlistBooks(token);
        setWishlistBooks(books);
    } catch (error: any) {
        createToast(error.message || 'Failed to fetch wishlist.', 'error');
    } finally {
        setIsLoading(false);
    }
}, [currentUser, createToast]);

  const fetchCommunityBooks = useCallback(async (page = 1) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        handleLogout();
        return;
    }
    setIsLoading(true);
    try {
        const filters = {
            ...submittedFilters,
            page: page,
            limit: ITEMS_PER_PAGE,
        };
        const data = await apiService.searchBooks(token, filters);
        setCommunityBooksData(data);
        setCommunityPage(page);
    } catch (error: any) {
        createToast(error.message || 'Failed to fetch community books.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [submittedFilters, createToast]);

  const fetchMyCollection = useCallback(async (page = 1) => {
    if (!currentUser) return;
    const token = localStorage.getItem('userToken');
    if (!token) {
        handleLogout();
        return;
    }
    setIsLoading(true);
    try {
        const filters = { 
            ownerId: currentUser.id, 
            page, 
            limit: ITEMS_PER_PAGE, 
            sortOrder: 'date_desc',
            term: submittedMyCollectionFilters.term,
            myCollectionStatus: submittedMyCollectionFilters.status
        };
        const data = await apiService.searchBooks(token, filters);
        setMyCollectionData(data);
        setMyCollectionPage(page);
    } catch (error: any) {
        createToast(error.message || "Failed to fetch your books.", 'error');
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, createToast, submittedMyCollectionFilters]);

  // Combined fetch function to refresh data as needed
  const refreshRelevantData = useCallback(async (viewToRefresh?: View) => {
    const view = viewToRefresh || currentView;
    if (view === 'communityBooks') {
        fetchCommunityBooks(communityPage);
    } else if (view === 'myLibrary') {
        fetchMyCollection(myCollectionPage);
    } else if (view === 'myActivityAndOutgoing' || view === 'myLendingActivity') {
        fetchActivityBooks();
    } else if (view === 'wishlist') {
        fetchWishlistBooks();
    }
  }, [currentView, communityPage, myCollectionPage, fetchMyCollection, fetchCommunityBooks, fetchActivityBooks, fetchWishlistBooks]);


    const fetchAdminData = useCallback(async () => {
        const token = localStorage.getItem('userToken');
        if (!token || !isAdminMode) return;
        setIsLoading(true);
        try {
            const [pending, allUsers, moderation, feedback, kpis] = await Promise.all([
                apiService.adminGetPendingUsers(token),
                apiService.adminGetAllUsers(token),
                apiService.adminGetModerationBooks(token, adminContentFilter),
                apiService.adminGetFeedback(token),
                apiService.adminGetKpis(token)
            ]);
            setAdminPendingUsers(pending);
            setAdminUsers(allUsers);
            setAdminModerationBooks(moderation);
            setFeedbackItems(feedback);
            setKpiData(kpis);
        } catch (error: any) {
            createToast(error.message || "Failed to fetch admin data.", 'error');
        } finally {
            setIsLoading(false);
        }
    }, [isAdminMode, adminContentFilter, createToast]);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        const fetchedNotifications = await apiService.getNotifications(token);
        setNotifications(fetchedNotifications.filter(n => n.type !== 'chat_message_received'));
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const fetchChatSessionsAndUsers = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !currentUser) return;

    setIsLoading(true);
    try {
        const sessions = await apiService.getChatSessions(token);
        setChatSessions(sessions);
        
        if (sessions.length > 0 && socket && socket.connected) {
            sessions.forEach(session => {
                socket.emit('join_session', session.id);
            });
        }
    } catch (error: any) {
        createToast(error.message || 'Failed to load conversations.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, createToast, socket]);

  const handleSelectChatSession = useCallback(async (sessionId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token || !socket) return;
    setActiveChatSessionId(sessionId);
    setChatMessages([]);
    try {
        const messages = await apiService.getChatMessages(token, sessionId);
        setChatMessages(messages);
        socket.emit('mark_chat_read', sessionId);
        
        // Correctly update the unread count in the UI using immutable state updates
        setChatSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === sessionId) {
              // Create a new session object to ensure immutability
              const newSession = {
                ...session,
                unreadCounts: session.unreadCounts.map(uc => {
                  if (uc.userId === currentUser?.id) {
                    // Create a new unread count object
                    return { ...uc, count: 0 };
                  }
                  return uc;
                })
              };
              return newSession;
            }
            return session;
          })
        );

    } catch (error: any) {
        createToast(error.message || 'Failed to load messages.', 'error');
    }
  }, [createToast, socket, currentUser]);


    useEffect(() => {
        activeChatSessionIdRef.current = activeChatSessionId;
    }, [activeChatSessionId]);

    // Effect for Socket.IO connection management
    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (currentUser?.id && token) {
            const newSocket = io('http://localhost:8080', { auth: { token } });
            setSocket(newSocket);

            newSocket.on('connect', () => console.log('Socket connected:', newSocket.id));
            newSocket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
            newSocket.on('chat_error', (error) => createToast(error.message || 'A chat error occurred.', 'error'));

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [currentUser?.id, createToast]);

    // Effect for handling incoming messages from socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: ChatMessage) => {
            setChatSessions(prevSessions =>
                prevSessions.map(s => {
                    if (s.id === message.sessionId) {
                        const newUnreadCounts = s.unreadCounts.map(uc => {
                            // Increment count if it's not the current user and not the active chat
                            if (uc.userId !== currentUser?.id && message.sessionId !== activeChatSessionIdRef.current) {
                                return { ...uc, count: uc.count + 1 };
                            }
                            return uc;
                        });
                        return { ...s, lastMessageText: message.messageText, lastMessageTimestamp: message.timestamp, unreadCounts: newUnreadCounts };
                    }
                    return s;
                }).sort((a,b) => b.lastMessageTimestamp - a.lastMessageTimestamp)
            );

            if (message.sessionId === activeChatSessionIdRef.current) {
                setChatMessages(prevMessages => [...prevMessages, message]);
            }
        };
        
        const handleSessionUpdate = (session: ChatSession) => {
            setChatSessions(prev => {
                const existing = prev.find(s => s.id === session.id);
                if (existing) {
                    return prev.map(s => s.id === session.id ? session : s);
                }
                return [session, ...prev];
            });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('session_updated', handleSessionUpdate);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('session_updated', handleSessionUpdate);
        };
    }, [socket, currentUser?.id]);

    // Effect for joining chat rooms when view changes
    useEffect(() => {
        if (socket && socket.connected && currentView === 'messages') {
            chatSessions.forEach(session => {
                socket.emit('join_session', session.id);
            });
        }
    }, [socket, socket?.connected, currentView, chatSessions]);


  // Initial data load effect
  useEffect(() => {
    const checkLoggedInAndHandleToken = async () => {
        setIsLoading(true);
        // Check for password reset token in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('resetToken');
        if (tokenFromUrl) {
            setResetTokenFromUrl(tokenFromUrl);
            setShowResetPasswordModal(true);
            // Clean up URL so the token isn't visible or reused on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                const userProfile = await apiService.getProfile(token);
                setCurrentUser(userProfile);
                setUsers([userProfile]); // Initialize users with the current user
                setCurrentView(userProfile.isAdmin ? 'adminDashboard' : 'communityBooks');
                fetchNotifications();
            } catch (error) {
                console.error("Session restore failed:", error);
                localStorage.removeItem('userToken');
                if (!tokenFromUrl) setCurrentView('auth');
            }
        } else {
             if (!tokenFromUrl) setCurrentView('auth');
        }
        setIsLoading(false);
    };
    checkLoggedInAndHandleToken();
  }, [fetchNotifications]);

  // Data fetching effects for different views
  useEffect(() => {
    if (currentUser && !isAdminMode) {
        if(currentView === 'myActivityAndOutgoing' || currentView === 'myLendingActivity') fetchActivityBooks();
        if(currentView === 'wishlist') fetchWishlistBooks();
        if(currentView === 'messages') fetchChatSessionsAndUsers();
    }
  }, [currentUser, currentView, isAdminMode, fetchActivityBooks, fetchWishlistBooks, fetchChatSessionsAndUsers]);
  
  useEffect(() => {
    if(currentUser && isAdminMode) fetchAdminData();
  }, [currentUser, isAdminMode, fetchAdminData, adminContentFilter]);

  useEffect(() => {
    if (currentUser && !isAdminMode && currentView === 'communityBooks') {
        fetchCommunityBooks(communityPage);
    }
  }, [currentUser, isAdminMode, currentView, communityPage, submittedFilters, fetchCommunityBooks]);

  useEffect(() => {
    if (currentUser && !isAdminMode && currentView === 'myLibrary') {
        fetchMyCollection(myCollectionPage);
    }
  }, [currentUser, isAdminMode, currentView, myCollectionPage, submittedMyCollectionFilters, fetchMyCollection]);

  useEffect(() => {
    if (currentUser && currentView === 'editProfile' && !isAdminMode) {
        setEditName(currentUser.name);
        setEditEmailOptOut(currentUser.emailOptOut || false); 
        setEditProfileFormErrors({});
    }
  }, [currentUser, currentView, isAdminMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isAdminMode && // Only applies to user view
        showNotifications &&
        notificationsButtonRef.current && !notificationsButtonRef.current.contains(event.target as Node) &&
        notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        !isAdminMode && // Only applies to user view
        userMenuOpen &&
        userMenuButtonRef.current && !userMenuButtonRef.current.contains(event.target as Node) &&
        userMenuDropdownRef.current && !userMenuDropdownRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, userMenuOpen, isAdminMode]);

  const handleShowBookDetails = useCallback(async (bookId: string) => {
    // Find the book from all possible sources
    const bookToShow = [...communityBooksData.books, ...myCollectionData.books, ...activityBooks, ...wishlistBooks].find(b => b.id === bookId);
    if (!bookToShow) {
        createToast("Could not find book details.", 'error');
        return;
    }

    // Check if we already have the owner's data
    const ownerExists = getUserById(bookToShow.ownerId);

    // If owner data is missing, fetch it
    if (!ownerExists && bookToShow.ownerId) {
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                // Fetch the single missing user
                const fetchedUsers = await apiService.getUsersByIds(token, [bookToShow.ownerId]);
                if (fetchedUsers && fetchedUsers.length > 0) {
                    // Add the fetched user to our state
                    setUsers(prevUsers => {
                        const usersMap = new Map(prevUsers.map(u => [u.id, u]));
                        fetchedUsers.forEach(u => usersMap.set(u.id, u));
                        return Array.from(usersMap.values());
                    });
                }
            } catch (error) {
                console.error("Failed to fetch owner details for modal:", error);
                // We can still show the modal, just without owner details
            }
        }
    }

    // Now, show the modal
    setSelectedBookForDetails(bookToShow);
    setShowBookDetailsModal(true);
  }, [communityBooksData, myCollectionData, activityBooks, wishlistBooks, getUserById, createToast]);

  const handleCloseBookDetailsModal = useCallback(() => {
    setShowBookDetailsModal(false);
    setSelectedBookForDetails(null);
  }, []);

  const handleMagnifyImage = (imageUrl: string) => {
    setMagnifiedImageUrl(imageUrl);
  };


  const clearValidationErrorsForField = (fieldName: string, formType: 'auth' | 'addBook' | 'editProfile' | 'feedback' | 'editBook' = 'auth') => {
    let setter: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    switch(formType) {
        case 'auth': setter = setValidationErrors; break;
        case 'addBook': setter = setAddBookFormErrors; break;
        case 'editProfile': setter = setEditProfileFormErrors; break;
        case 'feedback': setter = setFeedbackFormErrors; break;
        case 'editBook': setter = setEditBookFormErrors; break;
        default: setter = setValidationErrors;
    }
    setter(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
    });
  };
  
  const resetAuthForms = () => {
    setNewUserName(''); setNewUserPhoneNumber(''); setNewUserCommunityUnit(''); setNewUserEmail(''); setNewUserMyGateId('');
    setLoginEmail(''); setPassword(''); setValidationErrors({});
    setAuthActionInProgress(false);
    setReactivationMessage(null);
    setRegistrationPreconditions(JSON.parse(JSON.stringify(initialRegistrationPreconditions))); 
  };

  const validateAuthInputs = (isRegisterMode: boolean): boolean => {
    const errors: Record<string, string> = {};
    const email = isRegisterMode ? newUserEmail : loginEmail;
  
    if (isRegisterMode) {
      if (!newUserName.trim()) errors.newUserName = 'Name is required.';
      else if (/\d/.test(newUserName)) errors.newUserName = 'Name should not contain numbers.';
      if (!newUserCommunityUnit.trim()) errors.newUserCommunityUnit = 'Community unit is required.';
      else if (!/^[A-Za-z]{3}-\d{3}$/.test(newUserCommunityUnit.trim())) errors.newUserCommunityUnit = 'Unit must be in XXX-111 format (e.g., ABC-123).';
      if (!newUserPhoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
      else if (!/^\d{10}$/.test(newUserPhoneNumber)) errors.phoneNumber = 'Phone number must be 10 digits.';
       if (!newUserMyGateId.trim()) errors.mygateId = 'MyGate ID is required.';
      else if (!/^\d{6}$/.test(newUserMyGateId)) errors.mygateId = 'MyGate ID must be 6 digits.';
      const allPreconditionsChecked = registrationPreconditions.every(p => p.checked);
      if (!allPreconditionsChecked) errors.preconditions = 'You must agree to all terms and conditions to register.';
    }

    if (!email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Please enter a valid email address.';
    
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = useCallback(async () => {
    if (!validateAuthInputs(true)) return;
    setAuthActionInProgress(true);
    setValidationErrors({});

    try {
        const registrationData = {
            name: newUserName.trim(),
            phoneNumber: newUserPhoneNumber.trim(),
            communityUnit: newUserCommunityUnit.trim(),
            email: newUserEmail.trim(),
            password: password,
            mygateId: newUserMyGateId.trim(),
        };
        const result = await apiService.register(registrationData);
        createToast(result.message, 'success');
        resetAuthForms();
        setAuthMode('login');
    } catch (error: any) {
        setValidationErrors({ form: error.message || 'Registration failed. Please try again.' });
    } finally {
        setAuthActionInProgress(false);
    }
  }, [newUserName, newUserPhoneNumber, newUserCommunityUnit, newUserEmail, newUserMyGateId, password, registrationPreconditions, createToast]);

  const handleLogin = useCallback(async () => {
    if (!validateAuthInputs(false)) return;
    setAuthActionInProgress(true);
    setValidationErrors({});
    setReactivationMessage(null);

    try {
        const data = await apiService.login(loginEmail.trim(), password);
        localStorage.setItem('userToken', data.token);
        setCurrentUser(data);
        setCurrentView(data.isAdmin ? 'adminDashboard' : 'communityBooks');
        setCurrentAdminSubView('dashboardHome');
        createToast(data.isAdmin ? 'Admin login successful.' : 'Login successful! Welcome back.', 'success');
        resetAuthForms();
    } catch (error: any) {
        setValidationErrors({ form: error.message || 'Invalid email or password.' });
        if (error.reactivationPossible) {
            setReactivationMessage(error.message);
        }
    } finally {
        setAuthActionInProgress(false);
    }
  }, [loginEmail, password, createToast]);
  
  const handleForgotPasswordRequest = useCallback(async () => {
    setResetPasswordError('');
    if (!emailForReset) {
      setResetPasswordError('Please enter your email address.');
      return;
    }
    setAuthActionInProgress(true);
    try {
      const response = await apiService.forgotPassword(emailForReset);
      createToast(response.message, 'success');
      setShowForgotPasswordModal(false);
    } catch (error: any) {
      setResetPasswordError(error.message || 'Failed to send reset instructions.');
      createToast(error.message || 'Failed to send reset instructions.', 'error');
    } finally {
      setAuthActionInProgress(false);
    }
  }, [emailForReset, createToast]);

  const handleResetPasswordSubmit = useCallback(async () => {
    if (newPassword.length < 6) {
        setResetPasswordError('Password must be at least 6 characters long.');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setResetPasswordError('Passwords do not match.');
        return;
    }
    if (!resetTokenFromUrl) {
        setResetPasswordError('No reset token found. Please use the link from your email again.');
        return;
    }
    setAuthActionInProgress(true);
    setResetPasswordError('');
    try {
        const response = await apiService.resetPassword(resetTokenFromUrl, newPassword);
        createToast(response.message, 'success');
        setShowResetPasswordModal(false);
        setResetTokenFromUrl(null);
        setNewPassword('');
        setConfirmNewPassword('');
    } catch (error: any) {
        setResetPasswordError(error.message || 'Failed to reset password.');
    } finally {
        setAuthActionInProgress(false);
    }
  }, [newPassword, confirmNewPassword, resetTokenFromUrl, createToast]);

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    localStorage.removeItem('userToken');
    setCurrentUser(null); 
    setUsers([]);
    setNotifications([]);
    setCommunityBooksData({ books: [], page: 1, totalPages: 1, totalBooks: 0 });
    setActivityBooks([]);
    setWishlistBooks([]);
    setAdminUsers([]);
    setAdminPendingUsers([]);
    setFeedbackItems([]);
    setChatSessions([]);
    setCurrentView('auth' as View); 
    setAuthMode('login'); 
    resetAuthForms(); 
    setShowNotifications(false); 
    setUserMenuOpen(false);
    setEditProfileFormErrors({}); 
    handleCloseBookDetailsModal(); 
    setActiveChatSessionId(null); 
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (formType === 'add') {
            setNewBookCoverImage(reader.result as string);
        } else {
            setEditBookFormValues(prev => ({ ...prev, coverImageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetAddBookForm = () => {
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookCoverImage(null);
      setNewBookDescription('');
      setNewBookIsbn('');
      setNewBookGenre('');
      setNewBookLanguage('');
      setNewBookIsGiveaway(false);
      setBookSearchQuery('');
      setBookSearchResults([]);
      setBookSearchError(null);
      setAddBookFormErrors({});
      const coverImageInput = document.getElementById('newBookCoverImage') as HTMLInputElement;
      if (coverImageInput) coverImageInput.value = '';
  }

  const handleAddBook = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    
    setAuthActionInProgress(true);
    setAddBookFormErrors({});

    // Frontend validation for mandatory cover image
    if (!newBookCoverImage) {
        setAddBookFormErrors({ coverImageUrl: 'Cover image is required.' });
        setAuthActionInProgress(false);
        return;
    }

    try {
        const bookData: Partial<Book> = {
            title: newBookTitle,
            author: newBookAuthor,
            description: newBookDescription,
            isbn: newBookIsbn,
            genre: newBookGenre,
            language: newBookLanguage,
            isGiveaway: newBookIsGiveaway,
            coverImageUrl: newBookCoverImage,
        };
        const newBook = await apiService.createBook(token, bookData);
        createToast(`'${newBook.title}' has been added to your library.`, 'success');
        resetAddBookForm();
        setSubmittedMyCollectionFilters({ term: '', status: 'all' }); // Refresh to show new book
    } catch(error: any) {
        if (error.details) {
            setAddBookFormErrors(error.details);
        } else {
            createToast(error.message || "Failed to add book.", "error");
        }
    } finally {
        setAuthActionInProgress(false);
    }
  }, [newBookTitle, newBookAuthor, newBookDescription, newBookIsbn, newBookGenre, newBookLanguage, newBookIsGiveaway, newBookCoverImage, createToast]);

  const handleOpenEditBookModal = (bookId: string) => {
    const bookToEdit = myCollectionData.books.find(b => b.id === bookId);
    if(bookToEdit){
      setEditingBookId(bookId);
      setEditBookFormValues(bookToEdit);
      setEditBookFormErrors({});
      setShowEditBookModal(true);
    }
  };

  const handleUpdateBookDetails = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !editingBookId) return handleLogout();

    setAuthActionInProgress(true);
    setEditBookFormErrors({});

    if (!editBookFormValues.coverImageUrl) {
        setEditBookFormErrors({ coverImageUrl: 'Cover image is required.' });
        setAuthActionInProgress(false);
        return;
    }

    try {
        const updatedBook = await apiService.updateBook(token, editingBookId, editBookFormValues);
        createToast(`'${updatedBook.title}' has been updated.`, 'success');
        setShowEditBookModal(false);
        setEditingBookId(null);
        fetchMyCollection(myCollectionPage); // Refetch current page
    } catch (error: any) {
        if (error.details) {
            setEditBookFormErrors(error.details);
        } else {
            createToast(error.message || "Failed to update book.", "error");
        }
    } finally {
        setAuthActionInProgress(false);
    }
  }, [editingBookId, editBookFormValues, myCollectionPage, createToast, fetchMyCollection]);

  const handleShowDeleteBookModal = (bookId: string) => {
    setBookToDeleteId(bookId);
    setShowDeleteBookModal(true);
  };

  const confirmDeleteBookLogic = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !bookToDeleteId) return handleLogout();

    try {
        await apiService.deleteBook(token, bookToDeleteId);
        createToast("Book deleted successfully.", 'success');
        setShowDeleteBookModal(false);
        setBookToDeleteId(null);
        fetchMyCollection(); // Refetch collection, might change total pages
    } catch (error: any) {
        createToast(error.message || "Failed to delete book.", 'error');
    }
  }, [bookToDeleteId, createToast, fetchMyCollection]);

  const handleTogglePauseBook = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();

    const book = myCollectionData.books.find(b => b.id === bookId);
    if (!book) return;

    try {
        const updatedBook = await apiService.togglePauseBook(token, bookId, !book.isPausedByOwner);
        createToast(`Sharing for '${updatedBook.title}' has been ${updatedBook.isPausedByOwner ? 'paused' : 'resumed'}.`, 'success');
        fetchMyCollection(myCollectionPage); // Refetch current page
    } catch (error: any) {
        createToast(error.message || "Failed to update book status.", 'error');
    }
  }, [myCollectionData.books, myCollectionPage, createToast, fetchMyCollection]);


  const handleRequestBook = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.requestBook(token, bookId);
      createToast(`Request sent for '${updatedBook.title}'.`, 'success');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to request book.', 'error');
    }
  }, [createToast, refreshRelevantData]);

  const handleApproveRequest = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.approveRequest(token, bookId);
      createToast(`You approved the request for '${updatedBook.title}'.`, 'success');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to approve request.', 'error');
    }
  }, [createToast, refreshRelevantData]);

  const handleRejectRequest = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.rejectRequest(token, bookId);
      createToast(`You rejected the request for '${updatedBook.title}'.`, 'info');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to reject request.', 'error');
    }
  }, [createToast, refreshRelevantData]);
  
  const handleCancelRequest = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.cancelRequest(token, bookId);
      createToast(`Request for '${updatedBook.title}' cancelled.`, 'info');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to cancel request.', 'error');
    }
  }, [createToast, refreshRelevantData]);

  const handleRevokeApproval = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.revokeApproval(token, bookId);
        createToast('Approval has been revoked.', 'info');
        refreshRelevantData();
    } catch (error: any) {
        createToast(error.message || 'Failed to revoke approval.', 'error');
    }
  }, [createToast, refreshRelevantData]);

  const handleConfirmPickup = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.confirmPickup(token, bookId);
      createToast(`You've picked up '${updatedBook.title}'. Happy reading!`, 'success');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to confirm pickup.', 'error');
    }
  }, [createToast, refreshRelevantData]);

  const handleMarkAsReturnedByOwner = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return handleLogout();
    try {
      const updatedBook = await apiService.markAsReturned(token, bookId);
      createToast(`'${updatedBook.title}' has been marked as returned.`, 'success');
      refreshRelevantData();
    } catch (error: any) {
      createToast(error.message || 'Failed to mark book as returned.', 'error');
    }
  }, [createToast, refreshRelevantData]);
  
  const handleUpdateProfile = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !currentUser) return;
    setEditProfileFormErrors({});
    try {
        const updatedUser = await apiService.updateProfile(token, {
            name: editName,
            emailOptOut: editEmailOptOut
        });
        setCurrentUser(updatedUser);
        createToast('Profile updated successfully!', 'success');
    } catch (error: any) {
        setEditProfileFormErrors({ form: error.message || 'Failed to update profile.' });
    }
}, [currentUser, editName, editEmailOptOut, createToast]);
  

  const canUserSafelyModifyAccount = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('userToken');
    if (!token) return false;
    try {
        // A simplified check. A dedicated backend endpoint would be better.
        const response = await apiService.searchBooks(token, { viewContext: 'activity' });
        const hasActiveTransactions = response.books.some(book => 
            book.borrowRequestStatus === 'pending' || 
            book.borrowRequestStatus === 'approved' || 
            book.borrowRequestStatus === 'pickup_confirmed'
        );
        if (hasActiveTransactions) {
            createToast('Please resolve all active book transactions before modifying your account.', 'error');
            return false;
        }
        return true;
    } catch {
        createToast('Could not verify account status. Please try again.', 'error');
        return false;
    }
}, [createToast]);


  const handleSelfDeactivateAccount = useCallback(async () => {
    if (!await canUserSafelyModifyAccount()) return;
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.selfDeactivateAccount(token);
        createToast('Your account has been deactivated.', 'info');
        setShowDeactivateProfileModal(false);
        handleLogout();
    } catch (error: any) {
        createToast(error.message || 'Failed to deactivate account.', 'error');
    }
  }, [canUserSafelyModifyAccount, createToast]);

  const handleUserRequestReactivation = useCallback(async () => {
    setAuthActionInProgress(true);
    try {
      const response = await apiService.requestReactivation(loginEmail);
      createToast(response.message, 'success');
      setReactivationMessage(null); // Clear the button prompt
    } catch (error: any) {
      createToast(error.message || 'Failed to send reactivation request.', 'error');
    } finally {
      setAuthActionInProgress(false);
    }
}, [loginEmail, createToast]);


  const handleDeleteProfile = useCallback(async () => {
    if (!await canUserSafelyModifyAccount()) return;
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.deleteProfile(token);
        createToast('Your account has been permanently deleted.', 'success');
        setShowDeleteProfileModal(false);
        handleLogout();
    } catch (error: any) {
        createToast(error.message || 'Failed to delete account.', 'error');
    }
}, [canUserSafelyModifyAccount, createToast]);

  const handleSubmitFeedback = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    setFeedbackFormErrors({});
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
        setFeedbackFormErrors({ form: 'Subject and message are required.' });
        return;
    }
    try {
        await apiService.submitFeedback(token, feedbackSubject, feedbackMessage);
        createToast('Thank you for your feedback!', 'success');
        setFeedbackSubject('');
        setFeedbackMessage('');
        setCurrentView('communityBooks');
    } catch (error: any) {
        setFeedbackFormErrors({ form: error.message || 'Failed to submit feedback.' });
    }
  }, [feedbackSubject, feedbackMessage, createToast]);

  const handleApproveRegistration = useCallback(async (userId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminApproveUser(token, userId);
        createToast('User registration approved.', 'success');
        fetchAdminData(); // Refresh admin data
    } catch (error: any) {
        createToast(error.message || 'Failed to approve user.', 'error');
    }
  }, [fetchAdminData, createToast]);

  const handleRejectRegistration = useCallback(async (userId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminRejectUser(token, userId);
        createToast('User registration rejected and removed.', 'info');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to reject user.', 'error');
    }
  }, [fetchAdminData, createToast]);

  const handleToggleUserActivation = useCallback(async (userIdToToggle: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        const updatedUser = await apiService.adminToggleUserActivation(token, userIdToToggle);
        createToast(`User account for ${updatedUser.name} has been ${updatedUser.isActive ? 'activated' : 'deactivated'}.`, 'success');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to update user status.', 'error');
    }
  }, [fetchAdminData, createToast]);


  const handleUpdateFeedbackStatus = useCallback(async (feedbackId: string, newStatus: FeedbackStatus) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminUpdateFeedbackStatus(token, feedbackId, newStatus);
        createToast('Feedback status updated.', 'success');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to update feedback.', 'error');
    }
  }, [fetchAdminData, createToast]);

 const handleOpenReportModal = (bookId: string) => {
    setReportingBookId(bookId);
    setShowReportBookModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportBookModal(false);
    setReportingBookId(null);
    setReportBookReason('');
    setReportBookError(null);
  };

  const handleConfirmReportBook = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !reportingBookId) return;
    setReportBookError(null);
    if (!reportBookReason.trim()) {
        setReportBookError('A reason is required to submit a report.');
        return;
    }
    try {
        await apiService.reportBook(token, reportingBookId, reportBookReason);
        createToast('Book reported successfully. An admin will review it.', 'success');
        handleCloseReportModal();
        refreshRelevantData('communityBooks');
    } catch (error: any) {
        setReportBookError(error.message || 'Failed to report book.');
    }
  }, [reportingBookId, reportBookReason, createToast, refreshRelevantData]);


  const handleAdminDeactivateBook = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminDeactivateBook(token, bookId);
        createToast('Book has been deactivated and hidden.', 'success');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to deactivate book.', 'error');
    }
  }, [fetchAdminData, createToast]);

  const handleAdminReactivateBook = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminReactivateBook(token, bookId);
        createToast('Book has been reactivated and is now visible.', 'success');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to reactivate book.', 'error');
    }
  }, [fetchAdminData, createToast]);

  const handleAdminDismissReport = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.adminDismissReport(token, bookId);
        createToast('Report dismissed. The book remains active.', 'info');
        fetchAdminData();
    } catch (error: any) {
        createToast(error.message || 'Failed to dismiss report.', 'error');
    }
  }, [fetchAdminData, createToast]);

  const handleRemindBorrower = useCallback(async (bookId: string, borrowerId: string) => {
    // Simplified for now, will call API in future.
    const borrower = getUserById(borrowerId);
    const book = [...communityBooksData.books, ...myCollectionData.books, ...activityBooks].find(b => b.id === bookId);
    if (borrower && book) {
        createToast(`Reminder sent to ${borrower.name} for '${book.title}'.`, 'info');
    }
  }, [getUserById, communityBooksData, myCollectionData, activityBooks, createToast]);

  const handleToggleWishlist = useCallback(async (bookId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token || !currentUser) return;
    try {
        const updatedUser = await apiService.toggleWishlist(token, bookId);
        const isInWishlist = updatedUser.wishlistBookIds?.includes(bookId);
        createToast(isInWishlist ? 'Added to your wishlist!' : 'Removed from your wishlist.', 'success');
        setCurrentUser(updatedUser); // Update user state with new wishlist
        // Optionally, refresh wishlist view if current
        if (currentView === 'wishlist') {
            fetchWishlistBooks();
        }
    } catch (error: any) {
        createToast(error.message || 'Failed to update wishlist.', 'error');
    }
  }, [currentUser, currentView, createToast, fetchWishlistBooks]);


  // Messaging Logic
  const handleInitiateChat = useCallback(async (otherUserId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        const session = await apiService.initiateChat(token, otherUserId);
        
        if(socket) {
            socket.emit('join_session', session.id);
        }

        // Add session to state if it's new
        setChatSessions(prev => {
            const existing = prev.find(s => s.id === session.id);
            if (existing) return prev;
            return [session, ...prev];
        });

        // Navigate to messages view and select the chat
        setCurrentView('messages');
        setActiveChatSessionId(session.id);
        
        // Fetch messages for the new/existing session
        const messages = await apiService.getChatMessages(token, session.id);
        setChatMessages(messages);

    } catch (error: any) {
        createToast(error.message || 'Failed to start chat.', 'error');
    }
  }, [createToast, socket]);

  const handleSendMessage = useCallback(async () => {
    if (!socket || !activeChatSessionId || !chatMessageInput.trim()) return;
    
    socket.emit('send_message', {
        sessionId: activeChatSessionId,
        messageText: chatMessageInput.trim(),
    });
    
    setChatMessageInput('');
  }, [socket, activeChatSessionId, chatMessageInput]);

   useEffect(() => { 
    if (currentView === 'messages' && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, currentView]);

  const handleCommunitySearchButtonClick = useCallback(() => {
      setCommunityPage(1);
      setSubmittedFilters({
        term: filterSearchTerm,
        availability: filterAvailability,
        genre: filterGenre,
        language: filterLanguage,
        giveawayOnly: filterGiveawayOnly,
        dateAdded: 'any',
        sortOrder: sortOrder,
      });
  }, [filterSearchTerm, filterAvailability, filterGenre, filterLanguage, filterGiveawayOnly, sortOrder]);

  const handleMyCollectionSearchButtonClick = useCallback(() => {
      setMyCollectionPage(1);
      setSubmittedMyCollectionFilters({
          term: myCollectionSearchTerm,
          status: myCollectionStatus
      });
  }, [myCollectionSearchTerm, myCollectionStatus]);


  const handleSelectBookFromSearch = (book: GoogleBookSearchResult) => {
    setNewBookTitle(book.volumeInfo.title || '');
    setNewBookAuthor(book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : '');
    setNewBookDescription(book.volumeInfo.description || '');
    setNewBookCoverImage(book.volumeInfo.imageLinks?.thumbnail || book.volumeInfo.imageLinks?.smallThumbnail || null);
    setNewBookLanguage(book.volumeInfo.language === 'en' ? 'English' : (BOOK_LANGUAGES.find(l => l.toLowerCase().includes(book.volumeInfo.language || '')) || 'Other'));
    
    const isbn13 = book.volumeInfo.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier;
    const isbn10 = book.volumeInfo.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier;
    setNewBookIsbn(isbn13 || isbn10 || '');
    
    setAddBookFormErrors({});
    setAddBookMode('manual');
  };

  const markNotificationAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.markNotificationAsRead(token, notificationId);
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };
  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    try {
        await apiService.markAllNotificationsAsRead(token);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
    }
  };
  
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const totalUnreadMessages = chatSessions.reduce((total, session) => {
    const myUnread = session.unreadCounts.find(uc => uc.userId === currentUser?.id);
    return total + (myUnread?.count || 0);
  }, 0);

  const calculateOverdueInfo = useCallback((pickupTimestamp?: number): OverdueInfo | undefined => {
    if (!pickupTimestamp) return undefined;
    const borrowedDate = new Date(pickupTimestamp);
    const today = new Date();
    const timeDiff = today.getTime() - borrowedDate.getTime();
    const daysBorrowed = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return { daysBorrowed: daysBorrowed, isOverdue: daysBorrowed > 15 };
  }, []);

  const activeUserTransactions = currentUser ? activityBooks.filter(b => 
    (b.requestedByUserId === currentUser.id && (b.borrowRequestStatus === 'pending' || b.borrowRequestStatus === 'approved')) ||
    (b.borrowedByUserId === currentUser.id && b.borrowRequestStatus === 'pickup_confirmed')
  ).length : 0;
  
  const hasReachedRequestLimit = activeUserTransactions >= REQUEST_LIMIT;
  
  // RENDER METHODS

  const renderAuthView = () => {
    const allPreconditionsChecked = registrationPreconditions.every(p => p.checked);

    const handlePreconditionChange = (id: string, checked: boolean) => {
      setRegistrationPreconditions(prev => 
        prev.map(p => p.id === id ? {...p, checked} : p)
      );
      clearValidationErrorsForField('preconditions');
    };

    return (
    <section className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl max-w-lg mx-auto transform hover:scale-105 transition-transform duration-300">
        <div className="flex justify-center mb-6">
            <button 
                onClick={() => { setAuthMode('register'); resetAuthForms(); }}
                className={`px-6 py-3 font-semibold rounded-l-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400
                            ${authMode === 'register' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                disabled={authActionInProgress}
            > Register </button>
            <button 
                onClick={() => { setAuthMode('login'); resetAuthForms(); }}
                className={`px-6 py-3 font-semibold rounded-r-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400
                            ${authMode === 'login' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                disabled={authActionInProgress}
            > Login </button>
        </div>
         <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 mr-2 text-purple-500" /> 
            {authMode === 'register' ? 'Join Our Thriving BookVerse!' : 'Welcome Back to Your BookVerse!'}
        </h2>

        {validationErrors.form && <div className="mb-4"><AlertToast id="auth-form-error" type="error" message={validationErrors.form} onClose={() => clearValidationErrorsForField('form')} /></div>}
        {reactivationMessage && <div className="mb-4 text-center p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
           {reactivationMessage}
           <button onClick={handleUserRequestReactivation} className="font-bold underline ml-2 hover:text-yellow-900" disabled={authActionInProgress}>
            {authActionInProgress ? 'Sending...' : 'Request Reactivation'}
           </button>
        </div>}
        <div className="space-y-5">
            {authMode === 'register' && ( <>
                <AuthInput id="newUserName" label="Full Name" value={newUserName} onChange={setNewUserName} error={validationErrors.newUserName} placeholder="e.g., Jane Doe" clearError={() => clearValidationErrorsForField('newUserName')} />
                <AuthInput id="newUserCommunityUnit" label="Community Unit (e.g., ABC-123)" value={newUserCommunityUnit} onChange={setNewUserCommunityUnit} error={validationErrors.newUserCommunityUnit} placeholder="e.g., HGT-456" clearError={() => clearValidationErrorsForField('newUserCommunityUnit')} />
                <div className="flex items-center space-x-2">
                    <AuthInput id="newUserMyGateId" type="tel" label="MyGate ID (6 digits)" value={newUserMyGateId} onChange={setNewUserMyGateId} error={validationErrors.mygateId} placeholder="Your MyGate ID" clearError={() => clearValidationErrorsForField('mygateId')} />
                     <Tooltip text="This unique 6-digit ID is used for validation by the admin. It's available in your community's MyGate app settings.">
                       <InformationCircleIcon className="w-5 h-5 text-gray-400 mt-6 cursor-help" />
                    </Tooltip>
                </div>
                <AuthInput id="newUserEmail" type="email" label="Email Address (for login)" value={newUserEmail} onChange={setNewUserEmail} error={validationErrors.email} placeholder="e.g., jane.doe@example.com" clearError={() => clearValidationErrorsForField('email')} />
                <AuthInput id="newUserPhoneNumber" type="tel" label="10-Digit Phone Number" value={newUserPhoneNumber} onChange={setNewUserPhoneNumber} error={validationErrors.phoneNumber} placeholder="Your phone number" clearError={() => clearValidationErrorsForField('phoneNumber')} />
                <AuthInput id="password" label="Password (min. 6 characters)" value={password} onChange={setPassword} error={validationErrors.password} placeholder="Create a strong password" type={passwordVisible ? 'text' : 'password'} clearError={() => clearValidationErrorsForField('password')} >
                    <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                        {passwordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </AuthInput>
                <PasswordStrengthMeter password={password} />
                <div className="space-y-3 mt-4">
                  {registrationPreconditions.map((precondition) => (
                    <div key={precondition.id} className="flex items-start">
                      <input
                        id={precondition.id}
                        type="checkbox"
                        checked={precondition.checked}
                        onChange={(e) => handlePreconditionChange(precondition.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                      />
                      <label htmlFor={precondition.id} className="ml-2.5 block text-xs text-gray-600">
                        {precondition.text}
                      </label>
                    </div>
                  ))}
                  {validationErrors.preconditions && <p className="text-red-500 text-xs mt-1">{validationErrors.preconditions}</p>}
                </div>

                <AuthButton onClick={handleRegister} disabled={authActionInProgress || !allPreconditionsChecked}>
                    {authActionInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Register & Await Approval'}
                </AuthButton>
            </> )}

            {authMode === 'login' && ( <>
                <AuthInput id="loginEmail" type="email" label="Email Address" value={loginEmail} onChange={setLoginEmail} error={validationErrors.email} placeholder="Your registered email" clearError={() => clearValidationErrorsForField('email')} />
                <AuthInput id="password" label="Password" value={password} onChange={setPassword} error={validationErrors.password} placeholder="Your password" type={loginPasswordVisible ? 'text' : 'password'} clearError={() => clearValidationErrorsForField('password')}>
                    <button type="button" onClick={() => setLoginPasswordVisible(!loginPasswordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                        {loginPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </AuthInput>

                <div className="text-right">
                    <button 
                        onClick={() => {
                            setShowForgotPasswordModal(true);
                            setResetPasswordError('');
                            setEmailForReset(loginEmail);
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>

                <AuthButton onClick={handleLogin} disabled={authActionInProgress}>
                    {authActionInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Login to BookVerse'}
                </AuthButton>
            </> )}
        </div>
    </section>
    );
  };
  

  const renderHeader = () => {
    if (!currentUser || isAdminMode) return null;
    return (
      <header className="bg-gradient-to-r from-slate-50 to-gray-100 shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="flex items-center text-xl sm:text-2xl font-bold cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-80 transition-opacity"
            onClick={() => setCurrentView('communityBooks')}
            title="Go to Community Books"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentView('communityBooks'); }}
          >
            <BookOpenIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 text-indigo-500" />
            <span>BookVerse</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              ref={notificationsButtonRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label={`View notifications (${unreadNotificationsCount} unread)`}
            >
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-100" />
              )}
            </button>
            {showNotifications && (
              <div ref={notificationsDropdownRef} className="absolute top-14 right-4 sm:right-6 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50 p-2 custom-scrollbar">
                <div className="flex justify-between items-center p-2 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-800">Notifications</h4>
                  {notifications.length > 0 && <button onClick={markAllNotificationsAsRead} className="text-xs text-indigo-600 hover:underline">Mark all as read</button>}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center p-6 text-sm text-slate-500">
                    <InboxStackIcon className="w-8 h-8 mx-auto mb-2 text-slate-400"/>
                    You have no notifications.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {notifications.slice(0, 20).map(n => (
                      <li key={n.id} className={`p-2 rounded-md transition-colors ${!n.isRead ? 'bg-indigo-50' : 'hover:bg-slate-50'}`} onClick={() => markNotificationAsRead(n.id)}>
                        <p className="text-xs text-slate-700">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                <UserCircleIcon className="w-7 h-7 text-slate-600"/>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div 
                  ref={userMenuDropdownRef} 
                  className="absolute top-12 right-0 mt-2 w-56 bg-white rounded-md shadow-2xl z-50 p-2"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-2 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate" title={currentUser.name}>{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate" title={currentUser.email}>{currentUser.email}</p>
                  </div>
                  <div className="py-1" role="none">
                     <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('editProfile'); setUserMenuOpen(false); }} className="flex items-center px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100" role="menuitem"><UserCircleIcon className="w-4 h-4 mr-2"/>Edit Profile</a>
                     <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('submitFeedback'); setUserMenuOpen(false); }} className="flex items-center px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100" role="menuitem"><EnvelopeIcon className="w-4 h-4 mr-2"/>Submit Feedback</a>
                     <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('tutorialFAQ'); setUserMenuOpen(false); }} className="flex items-center px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100" role="menuitem"><QuestionMarkCircleIcon className="w-4 h-4 mr-2"/>Help / FAQ</a>
                  </div>
                  <div className="py-1 border-t border-slate-100" role="none">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setUserMenuOpen(false); }} className="flex items-center px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50" role="menuitem"><ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2"/>Logout</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  };
  
  const renderNav = () => {
    if (!currentUser || isAdminMode) return null;

    const navItems = [
      { view: 'myLibrary' as View, label: 'My Library', icon: <LibraryIcon /> },
      { view: 'communityBooks' as View, label: 'Community Books', icon: <UsersIcon /> },
      { view: 'myActivityAndOutgoing' as View, label: 'My Borrows', icon: <ArrowDownCircleIcon/> },
      { view: 'myLendingActivity' as View, label: 'My Lending', icon: <ArrowRightCircleIcon/> },
      { view: 'wishlist' as View, label: 'My Wishlist', icon: <HeartIcon /> },
      { view: 'messages' as View, label: 'Messages', icon: <ChatBubbleOvalLeftEllipsisIcon />, badgeCount: totalUnreadMessages },
    ];

    return (
      <nav className="bg-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4 overflow-x-auto">
          <ul className="flex items-center space-x-4 sm:space-x-6">
            {navItems.map(item => (
              <li key={item.view} className="py-1">
                <button 
                  onClick={() => setCurrentView(item.view)}
                  className={`flex items-center space-x-2 px-3 py-3 font-semibold transition-all duration-200 border-b-4 ${currentView === item.view ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-indigo-500 hover:border-indigo-200'}`}
                >
                  {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                  <span className="hidden sm:inline-block text-sm whitespace-nowrap">{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badgeCount}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    );
  };
  
    const renderMyLibraryView = () => {
        if (!currentUser) return null;

        const handleGoogleBookSearch = async (e: React.FormEvent) => {
            e.preventDefault();
            const token = localStorage.getItem('userToken');
            if (!bookSearchQuery.trim() || !token) return;

            setIsBookSearchLoading(true);
            setBookSearchError(null);
            try {
                const results = await apiService.searchGoogleBooks(token, bookSearchQuery);
                setBookSearchResults(results);
                if (results.length === 0) {
                    setBookSearchError("No books found for your query. Try manual entry.");
                }
            } catch (error) {
                setBookSearchError((error as Error).message);
            } finally {
                setIsBookSearchLoading(false);
            }
        };

        const renderAddBookView = () => (
          <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Add a New Book</h3>
              <div className="flex justify-center mb-4 border border-slate-200 rounded-lg p-1 bg-slate-100">
                  <button onClick={() => setAddBookMode('search')} className={`px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors ${addBookMode === 'search' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Search Online</button>
                  <button onClick={() => { setAddBookMode('manual'); resetAddBookForm(); }} className={`px-4 py-2 text-sm font-semibold rounded-md flex-1 transition-colors ${addBookMode === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Manual Entry</button>
              </div>

              {addBookMode === 'search' ? (
                  <div>
                      <form onSubmit={handleGoogleBookSearch} className="flex gap-2 mb-4">
                          <input type="text" value={bookSearchQuery} onChange={e => setBookSearchQuery(e.target.value)} placeholder="Search by title or author..." className="w-full p-2 border rounded-lg"/>
                          <AppButton type="submit" disabled={isBookSearchLoading}>{isBookSearchLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : 'Search'}</AppButton>
                      </form>
                      {isBookSearchLoading ? <div className="text-center p-4">Loading...</div> : null}
                      {bookSearchError ? <div className="text-center p-4 text-red-600">{bookSearchError}</div> : null}
                      <ul className="space-y-2">
                          {bookSearchResults.map(book => (
                              <li key={book.id} className="flex items-center gap-4 p-2 border rounded-lg bg-slate-50">
                                  <img src={book.volumeInfo.imageLinks?.thumbnail} alt="" className="w-12 h-16 object-cover rounded"/>
                                  <div className="flex-grow">
                                      <p className="font-semibold">{book.volumeInfo.title}</p>
                                      <p className="text-sm text-slate-600">{book.volumeInfo.authors?.join(', ')}</p>
                                  </div>
                                  <AppButton size="sm" onClick={() => handleSelectBookFromSearch(book)}>Select</AppButton>
                              </li>
                          ))}
                      </ul>
                  </div>
              ) : (
                <div className="space-y-4">
                    <FormInput id="newBookTitle" label="Book Title" value={newBookTitle} onChange={setNewBookTitle} error={addBookFormErrors.title} clearError={() => clearValidationErrorsForField('title', 'addBook')} />
                    <FormInput id="newBookAuthor" label="Author" value={newBookAuthor} onChange={setNewBookAuthor} error={addBookFormErrors.author} clearError={() => clearValidationErrorsForField('author', 'addBook')} />
                    <FormInput id="newBookIsbn" label="ISBN (Optional)" value={newBookIsbn} onChange={setNewBookIsbn} error={addBookFormErrors.isbn} clearError={() => clearValidationErrorsForField('isbn', 'addBook')} />
                    <FormInputArea id="newBookDescription" label="Description (Optional)" value={newBookDescription} onChange={setNewBookDescription} error={addBookFormErrors.description} clearError={() => clearValidationErrorsForField('description', 'addBook')} />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image <span className="text-red-500">*</span></label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="flex-shrink-0 w-24 h-36 bg-slate-100 rounded-md flex items-center justify-center border">
                                {newBookCoverImage ? 
                                    <img src={newBookCoverImage} alt="Cover preview" className="w-full h-full object-cover rounded-md" /> : 
                                    <PhotoIcon className="w-10 h-10 text-slate-300" />
                                }
                            </div>
                            <input type="file" id="newBookCoverImage" accept="image/*" onChange={(e) => {handleCoverImageChange(e, 'add'); clearValidationErrorsForField('coverImageUrl', 'addBook')}} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        </div>
                        {addBookFormErrors.coverImageUrl && <p className="text-red-500 text-xs mt-1">{addBookFormErrors.coverImageUrl}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="newBookGenre" className="block text-sm font-medium text-gray-700 mb-1">Genre:</label>
                            <select id="newBookGenre" value={newBookGenre} onChange={e => {setNewBookGenre(e.target.value); clearValidationErrorsForField('genre', 'addBook')}} className={`w-full p-2.5 border bg-white rounded-lg ${addBookFormErrors.genre ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Select Genre</option>
                                {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {addBookFormErrors.genre && <p className="text-red-500 text-xs mt-1">{addBookFormErrors.genre}</p>}
                        </div>
                        <div>
                            <label htmlFor="newBookLanguage" className="block text-sm font-medium text-gray-700 mb-1">Language:</label>
                            <select id="newBookLanguage" value={newBookLanguage} onChange={e => {setNewBookLanguage(e.target.value); clearValidationErrorsForField('language', 'addBook')}} className={`w-full p-2.5 border bg-white rounded-lg ${addBookFormErrors.language ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Select Language</option>
                                {BOOK_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            {addBookFormErrors.language && <p className="text-red-500 text-xs mt-1">{addBookFormErrors.language}</p>}
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <input type="checkbox" id="newBookIsGiveaway" checked={newBookIsGiveaway} onChange={e => setNewBookIsGiveaway(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded" />
                        <label htmlFor="newBookIsGiveaway" className="text-sm font-medium text-gray-700">This is a giveaway (will not be returned)</label>
                    </div>
                    <AppButton onClick={handleAddBook} fullWidth disabled={authActionInProgress}>
                       {authActionInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Add Book to My Library'}
                    </AppButton>
                </div>
              )}
          </div>
        );

        const renderMyCollectionView = () => (
          <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">My Collection ({myCollectionData.totalBooks})</h3>
              
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border">
                  <div className="md:col-span-1">
                      <label htmlFor="myCollectionSearch" className="block text-sm font-medium text-gray-700 mb-1">Title / Author Search</label>
                      <input type="text" id="myCollectionSearch" value={myCollectionSearchTerm} onChange={(e) => setMyCollectionSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., The Hobbit" />
                  </div>
                  <div className="md:col-span-1">
                      <label htmlFor="myCollectionStatus" className="block text-sm font-medium text-gray-700 mb-1">Book Status</label>
                      <select id="myCollectionStatus" value={myCollectionStatus} onChange={(e) => setMyCollectionStatus(e.target.value as any)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          <option value="all">All My Books</option>
                          <option value="available">Available</option>
                          <option value="on_loan">On Loan / Requested</option>
                          <option value="paused">Paused</option>
                      </select>
                  </div>
                   <div className="md:col-span-1">
                     <AppButton onClick={handleMyCollectionSearchButtonClick} fullWidth icon={<MagnifyingGlassIcon className="w-5 h-5 mr-2"/>}>Search</AppButton>
                   </div>
              </div>

               {isLoading && !myCollectionData.books.length ? (
                  <div className="text-center p-4">Loading your books...</div>
               ) : myCollectionData.books.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {myCollectionData.books.map(book => (
                            <BookCard
                                key={book.id} book={book} currentUser={currentUser}
                                onEditBook={handleOpenEditBookModal}
                                onDeleteBook={handleShowDeleteBookModal}
                                onTogglePauseBook={handleTogglePauseBook}
                                onShowBookDetails={handleShowBookDetails}
                                onMagnifyImage={handleMagnifyImage}
                                viewContext="myLibrary"
                                AppButtonComponent={AppButton}
                                onrequestbook={()=>{}} onMarkAsReturned={()=>{}} onApproveRequest={()=>{}} onRejectRequest={()=>{}} onConfirmPickup={()=>{}} 
                            />
                        ))}
                    </div>
                     <div className="flex justify-between items-center mt-6">
                        <AppButton onClick={() => fetchMyCollection(myCollectionPage - 1)} disabled={myCollectionPage <= 1}>Previous</AppButton>
                        <span className="text-sm text-slate-600">Page {myCollectionData.page} of {myCollectionData.totalPages}</span>
                        <AppButton onClick={() => fetchMyCollection(myCollectionPage + 1)} disabled={myCollectionPage >= myCollectionData.totalPages}>Next</AppButton>
                    </div>
                </>
               ) : (
                <EmptyState icon={<LibraryIcon/>} title="No Books Found" message="No books in your collection match the current filters. Try adding a new book!" />
               )}
          </div>
        );

        return (
            <div className="space-y-6">
                <div className="flex border-b border-slate-200">
                    <button onClick={() => setMyLibrarySubView('collection')} className={`px-4 py-3 font-semibold ${myLibrarySubView === 'collection' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>My Collection</button>
                    <button onClick={() => { setMyLibrarySubView('add'); resetAddBookForm(); }} className={`px-4 py-3 font-semibold ${myLibrarySubView === 'add' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Add a New Book</button>
                </div>
                {myLibrarySubView === 'collection' ? renderMyCollectionView() : renderAddBookView()}
            </div>
        );
    };

    const renderCommunityBooksView = () => {
      return (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="lg:col-span-2">
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Title / Author Search</label>
                      <input type="text" id="search" value={filterSearchTerm} onChange={(e) => setFilterSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., The Hobbit" />
                  </div>
                  <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                      <select id="availability" value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value as any)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          <option value="all">All Books</option>
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                      </select>
                  </div>
                  <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                      <select id="genre" value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          <option value="all">All Genres</option>
                          {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select id="language" value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          <option value="all">All Languages</option>
                          {BOOK_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="giveaway" checked={filterGiveawayOnly} onChange={(e) => setFilterGiveawayOnly(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                    <label htmlFor="giveaway" className="ml-2 block text-sm text-gray-700">Show only available giveaways</label>
                  </div>
                  <div>
                      <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          <option value="date_desc">Date Added (Newest)</option>
                          <option value="date_asc">Date Added (Oldest)</option>
                          <option value="title_asc">Title (A-Z)</option>
                          <option value="title_desc">Title (Z-A)</option>
                          <option value="author_asc">Author (A-Z)</option>
                          <option value="author_desc">Author (Z-A)</option>
                      </select>
                  </div>
                  <AppButton onClick={handleCommunitySearchButtonClick} icon={<MagnifyingGlassIcon className="w-5 h-5 mr-2"/>}>Search</AppButton>
              </div>
          </div>
  
          {isLoading && !communityBooksData.books.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="bg-white shadow-lg rounded-lg animate-pulse">
                          <div className="h-36 bg-slate-200 rounded-t-lg"></div>
                          <div className="p-3 space-y-3">
                              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                              <div className="h-8 bg-slate-200 rounded mt-4"></div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : communityBooksData.books.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {communityBooksData.books.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    currentUser={currentUser}
                    owner={getUserById(book.ownerId)}
                    borrower={getUserById(book.borrowedByUserId)}
                    requester={getUserById(book.requestedByUserId)}
                    onrequestbook={handleRequestBook}
                    onShowBookDetails={handleShowBookDetails}
                    onMagnifyImage={handleMagnifyImage}
                    viewContext="communityBooks"
                    AppButtonComponent={AppButton}
                    onMarkAsReturned={handleMarkAsReturnedByOwner}
                    onApproveRequest={handleApproveRequest}
                    onRejectRequest={handleRejectRequest}
                    onRevokeApproval={handleRevokeApproval}
                    onConfirmPickup={handleConfirmPickup}
                    onCancelRequest={handleCancelRequest}
                    onToggleWishlist={handleToggleWishlist}
                    onOpenReportModal={handleOpenReportModal}
                    onInitiateChat={handleInitiateChat}
                    hasReachedRequestLimit={hasReachedRequestLimit}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center mt-6">
                  <AppButton onClick={() => fetchCommunityBooks(communityPage - 1)} disabled={communityPage <= 1}>Previous</AppButton>
                  <span className="text-sm text-slate-600">Page {communityBooksData.page} of {communityBooksData.totalPages}</span>
                  <AppButton onClick={() => fetchCommunityBooks(communityPage + 1)} disabled={communityPage >= communityBooksData.totalPages}>Next</AppButton>
              </div>
            </>
          ) : (
              <EmptyState icon={<MagnifyingGlassIcon />} title="No Books Found" message="Try adjusting your filters or search terms to find books in the community." />
          )}
        </div>
      );
    };

    const renderMyActivityAndOutgoingView = () => {
        if (!currentUser) return null;
        
        const pending = activityBooks.filter(b => b.requestedByUserId === currentUser.id && b.borrowRequestStatus === 'pending');
        const approved = activityBooks.filter(b => b.requestedByUserId === currentUser.id && b.borrowRequestStatus === 'approved');
        const borrowing = activityBooks.filter(b => b.borrowedByUserId === currentUser.id && b.borrowRequestStatus === 'pickup_confirmed');
        const giveaways = activityBooks.filter(b => b.borrowedByUserId === currentUser.id && b.borrowRequestStatus === 'giveaway_completed');
        
        return (
            <div className="space-y-6">
                <MyActivitySection title="Pending Requests Sent by Me" count={pending.length} icon={<ClockIcon />} books={pending} currentUser={currentUser} getUserById={getUserById} onCancelRequest={handleCancelRequest} onShowBookDetails={handleShowBookDetails} onMagnifyImage={handleMagnifyImage} AppButtonComponent={AppButton} showOwnerDetails={true} />
                <MyActivitySection title="Awaiting Pickup by Me" count={approved.length} icon={<CheckBadgeIcon />} books={approved} currentUser={currentUser} getUserById={getUserById} onConfirmPickup={handleConfirmPickup} onCancelRequest={handleCancelRequest} onShowBookDetails={handleShowBookDetails} onInitiateChat={handleInitiateChat} onMagnifyImage={handleMagnifyImage} AppButtonComponent={AppButton} showOwnerDetails={true} />
                <MyActivitySection title="Currently Borrowed by Me" count={borrowing.length} icon={<UserCircleIcon />} books={borrowing} currentUser={currentUser} getUserById={getUserById} calculateOverdueInfo={calculateOverdueInfo} onShowBookDetails={handleShowBookDetails} onInitiateChat={handleInitiateChat} onMagnifyImage={handleMagnifyImage} AppButtonComponent={AppButton} showOwnerDetails={true} />
                <MyActivitySection title="Giveaways Received" count={giveaways.length} icon={<GiftIcon/>} books={giveaways} currentUser={currentUser} getUserById={getUserById} onShowBookDetails={handleShowBookDetails} onMagnifyImage={handleMagnifyImage} AppButtonComponent={AppButton} showOwnerDetails={true} />
            </div>
        );
    };

    const renderMyLendingActivityView = () => {
        if (!currentUser) return null;

        const incomingRequests = activityBooks.filter(b => b.ownerId === currentUser.id && b.borrowRequestStatus === 'pending');
        const approvedForPickup = activityBooks.filter(b => b.ownerId === currentUser.id && b.borrowRequestStatus === 'approved');
        const lentOutBooks = activityBooks.filter(b => b.ownerId === currentUser.id && b.borrowRequestStatus === 'pickup_confirmed');
        const giveawaysCompleted = activityBooks.filter(b => b.ownerId === currentUser.id && b.borrowRequestStatus === 'giveaway_completed');
        
        return (
            <div className="space-y-6">
                 <MyActivitySection 
                    title="Incoming Requests" 
                    count={incomingRequests.length} 
                    icon={<HandRaisedIcon />} 
                    books={incomingRequests}
                    currentUser={currentUser} 
                    getUserById={getUserById} 
                    onShowBookDetails={handleShowBookDetails} 
                    onMagnifyImage={handleMagnifyImage} 
                    AppButtonComponent={AppButton}
                    onApproveRequest={handleApproveRequest}
                    onRejectRequest={handleRejectRequest}
                    onInitiateChat={handleInitiateChat}
                />
                <MyActivitySection 
                    title="Approved for Pickup" 
                    count={approvedForPickup.length} 
                    icon={<CheckBadgeIcon />} 
                    books={approvedForPickup}
                    currentUser={currentUser} 
                    getUserById={getUserById} 
                    onShowBookDetails={handleShowBookDetails} 
                    onMagnifyImage={handleMagnifyImage} 
                    AppButtonComponent={AppButton}
                    onInitiateChat={handleInitiateChat}
                    onRevokeApproval={handleRevokeApproval}
                />
                <MyActivitySection 
                    title="Currently Lent Out" 
                    count={lentOutBooks.length} 
                    icon={<UserCircleIcon />} 
                    books={lentOutBooks} 
                    currentUser={currentUser} 
                    getUserById={getUserById} 
                    calculateOverdueInfo={calculateOverdueInfo}
                    onShowBookDetails={handleShowBookDetails} 
                    onMagnifyImage={handleMagnifyImage} 
                    AppButtonComponent={AppButton}
                    onMarkAsReturned={handleMarkAsReturnedByOwner}
                    onRemindBorrower={handleRemindBorrower}
                    onInitiateChat={handleInitiateChat}
                />
                <MyActivitySection 
                    title="Books I've Given Away"
                    count={giveawaysCompleted.length}
                    icon={<GiftIcon />}
                    books={giveawaysCompleted}
                    currentUser={currentUser}
                    getUserById={getUserById}
                    onShowBookDetails={handleShowBookDetails}
                    onMagnifyImage={handleMagnifyImage}
                    AppButtonComponent={AppButton}
                />
            </div>
        );
    };

    const renderEditProfileView = () => {
        if (!currentUser) return null;
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">Edit Your Profile</h3>
                    {editProfileFormErrors.form && <AlertToast id="edit-profile-error" type="error" message={editProfileFormErrors.form} onClose={() => clearValidationErrorsForField('form', 'editProfile')} />}
                    <div className="space-y-4">
                        <FormInput id="editName" label="Full Name" value={editName} onChange={setEditName} error={editProfileFormErrors.name} clearError={() => clearValidationErrorsForField('name', 'editProfile')} />
                        <ReadOnlyInput label="Email Address (cannot be changed)" value={currentUser.email} />
                        <div className="flex items-center space-x-2 pt-2">
                            <input type="checkbox" id="editEmailOptOut" checked={editEmailOptOut} onChange={(e) => setEditEmailOptOut(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded" />
                            <label htmlFor="editEmailOptOut" className="text-sm font-medium text-gray-700">Opt-out of non-essential email notifications</label>
                        </div>
                        <AppButton onClick={handleUpdateProfile} fullWidth>Save Profile Changes</AppButton>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3 text-red-600">Account Actions</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-700">Deactivate Account</h4>
                            <p className="text-sm text-slate-500 mb-2">Temporarily hide your profile and book listings. You can reactivate it later.</p>
                            <AppButton variant="secondary" onClick={() => setShowDeactivateProfileModal(true)}>Deactivate My Account</AppButton>
                        </div>
                         <div>
                            <h4 className="font-semibold text-slate-700">Delete Account</h4>
                            <p className="text-sm text-slate-500 mb-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
                            <AppButton variant="danger" onClick={() => setShowDeleteProfileModal(true)}>Delete My Account Permanently</AppButton>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSubmitFeedbackView = () => {
         return (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Submit Feedback</h3>
                <p className="text-sm text-slate-500 mb-4">Have a suggestion, found a bug, or want to share your thoughts? Let us know!</p>
                {feedbackFormErrors.form && <AlertToast id="feedback-error" type="error" message={feedbackFormErrors.form} onClose={() => clearValidationErrorsForField('form', 'feedback')} />}
                <div className="space-y-4">
                    <FormInput id="feedbackSubject" label="Subject" value={feedbackSubject} onChange={setFeedbackSubject} placeholder="e.g., Suggestion for new feature" clearError={() => clearValidationErrorsForField('form', 'feedback')} />
                    <FormInputArea id="feedbackMessage" label="Message" value={feedbackMessage} onChange={setFeedbackMessage} placeholder="Please provide as much detail as possible." rows={5} clearError={() => clearValidationErrorsForField('form', 'feedback')} />
                    <AppButton onClick={handleSubmitFeedback} fullWidth>Submit Feedback</AppButton>
                </div>
            </div>
         );
    };
    

    const renderTutorialFAQView = () => (
        <div className="max-w-4xl mx-auto space-y-4">
            <HowItWorksGuide />
            <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Frequently Asked Questions</h2>
            {FAQ_DATA.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <button onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-700 hover:bg-slate-50">
                        <span>{item.question}</span>
                        {openFAQIndex === index ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                    </button>
                    {openFAQIndex === index && <div className="p-4 border-t text-slate-600 bg-slate-50"><p>{item.answer}</p></div>}
                </div>
            ))}
        </div>
    );
    
    const renderWishlistView = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">My Wishlist ({wishlistBooks.length})</h2>
                    {isLoading ? (
                         <div className="text-center p-4">Loading your wishlist...</div>
                    ) : wishlistBooks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {wishlistBooks.map(book => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    currentUser={currentUser}
                                    owner={getUserById(book.ownerId)}
                                    onrequestbook={handleRequestBook}
                                    onShowBookDetails={handleShowBookDetails}
                                    onMagnifyImage={handleMagnifyImage}
                                    onToggleWishlist={handleToggleWishlist}
                                    viewContext="wishlist"
                                    AppButtonComponent={AppButton}
                                    hasReachedRequestLimit={hasReachedRequestLimit}
                                    onMarkAsReturned={() => {}}
                                    onApproveRequest={() => {}}
                                    onRejectRequest={() => {}}
                                    onConfirmPickup={() => {}}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            icon={<HeartIcon />}
                            title="Your wishlist is empty"
                            message="Add books from the 'Community Books' view by clicking the heart icon."
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderMessagesView = () => {
        if (!currentUser) return null;
        const activeSession = chatSessions.find(s => s.id === activeChatSessionId);
        const hasActiveChat = !!(activeChatSessionId && activeSession);

        return (
            <div className="bg-white rounded-xl shadow-xl h-[calc(100vh-220px)] flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Chat List */}
                <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col ${hasActiveChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-200 flex-shrink-0">
                        <h2 className="text-lg font-bold text-slate-800">Conversations ({chatSessions.length})</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {isLoading && chatSessions.length === 0 ? <p className="p-4 text-center text-slate-500">Loading...</p> : null}
                        {!isLoading && chatSessions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500 mt-4">
                                <EmptyState icon={<ChatBubbleOvalLeftEllipsisIcon/>} title="No Conversations" message="Start a chat from a book card to see it here." isCompact/>
                            </div>
                        ) : (
                            chatSessions.map(session => {
                                const otherUser = session.participantIds.find(p => p.id !== currentUser.id);
                                const unreadCount = session.unreadCounts.find(uc => uc.userId === currentUser.id)?.count || 0;
                                return (
                                    <button
                                        key={session.id}
                                        onClick={() => handleSelectChatSession(session.id)}
                                        className={`w-full text-left p-3 flex items-center gap-3 transition-colors border-b border-slate-100 ${activeChatSessionId === session.id ? 'bg-indigo-100' : 'hover:bg-slate-50'} ${unreadCount > 0 ? 'font-bold' : ''}`}
                                    >
                                        <UserCircleIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                                        <div className="overflow-hidden flex-grow">
                                            <p className={`text-sm text-slate-800 truncate ${unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}>{otherUser ? `${otherUser.name} (${otherUser.communityUnit})` : 'User'}</p>
                                            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-600' : 'text-slate-500'}`}>{session.lastMessageText || 'No messages yet'}</p>
                                        </div>
                                        {unreadCount > 0 && <span className="bg-indigo-500 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">{unreadCount}</span>}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
    
                {/* Right Panel: Chat Window */}
                <div className={`w-full md:w-2/3 flex flex-col ${hasActiveChat ? 'flex' : 'hidden md:flex'}`}>
                    {hasActiveChat && activeSession ? (
                        <>
                            <div className="p-3 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setActiveChatSessionId(null)} className="md:hidden p-1 rounded-full hover:bg-slate-100" aria-label="Back to conversations">
                                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{activeSession.participantIds.find(p=>p.id !== currentUser.id)?.name || 'User'}</h3>
                                        <p className="text-xs text-slate-500">Messages are retained for 7 days.</p>
                                    </div>
                                </div>
                            </div>
    
                            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
                                {chatMessages.map((msg, index) => (
                                    <div key={msg.id || index} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-white text-slate-800'}`}>
                                            <p className="text-sm break-words">{msg.messageText}</p>
                                            <p className={`text-xs mt-1 opacity-70 ${msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-slate-500'}`}>{formatMessageTimestamp(msg.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatMessagesEndRef} />
                            </div>
    
                            <div className="p-3 border-t border-slate-200 flex-shrink-0 bg-white">
                                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                                    <div className="relative w-full">
                                        <input 
                                            type="text"
                                            value={chatMessageInput}
                                            onChange={(e) => setChatMessageInput(e.target.value)}
                                            placeholder="Type a message..."
                                            maxLength={CHAT_MESSAGE_MAX_LENGTH}
                                            className="w-full p-2 border rounded-lg pr-12"
                                        />
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${chatMessageInput.length >= CHAT_MESSAGE_MAX_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                                            {chatMessageInput.length}/{CHAT_MESSAGE_MAX_LENGTH}
                                        </span>
                                    </div>
                                    <AppButton type="submit" icon={<PaperAirplaneIcon className="w-5 h-5"/>} disabled={!chatMessageInput.trim() || !socket} aria-label="Send Message"></AppButton>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-slate-500 bg-slate-50 text-center p-4">
                            <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 mb-4" />
                            <h3 className="text-lg font-semibold">Select a conversation</h3>
                            <p className="text-sm">Choose a chat from the left to view messages.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderBookDetailsModalContent = () => {
        if (!selectedBookForDetails) return null;
        const owner = getUserById(selectedBookForDetails.ownerId);
        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {selectedBookForDetails.coverImageUrl ? (
                        <img 
                          src={selectedBookForDetails.coverImageUrl} 
                          alt={`Cover of ${selectedBookForDetails.title}`} 
                          className="w-32 h-48 object-cover rounded-md shadow-md flex-shrink-0 cursor-pointer"
                          onClick={() => handleMagnifyImage(selectedBookForDetails.coverImageUrl!)}
                        />
                    ) : (
                         <div className="w-32 h-48 flex-shrink-0 bg-slate-100 rounded-md flex items-center justify-center">
                            <DefaultBookIcon className="w-16 h-16 text-slate-300"/>
                        </div>
                    )}
                    <div className="space-y-2 text-sm">
                        <p><span className="font-semibold text-slate-600">Author:</span> {selectedBookForDetails.author}</p>
                        <p><span className="font-semibold text-slate-600">Genre:</span> {selectedBookForDetails.genre}</p>
                        <p><span className="font-semibold text-slate-600">Language:</span> {selectedBookForDetails.language}</p>
                        {selectedBookForDetails.isbn && <p><span className="font-semibold text-slate-600">ISBN:</span> {selectedBookForDetails.isbn}</p>}
                        {owner && <p><span className="font-semibold text-slate-600">Owner:</span> {`${owner.name} (${owner.communityUnit})`}</p>}
                        <p><span className="font-semibold text-slate-600">Date Added:</span> {new Date(selectedBookForDetails.dateAdded).toLocaleDateString()}</p>
                    </div>
                </div>
                 {selectedBookForDetails.description && (
                    <div className="pt-3 border-t">
                        <h4 className="font-semibold text-slate-800 mb-1">Description</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedBookForDetails.description}</p>
                    </div>
                 )}
            </div>
        );
    };

    const renderAdminDashboardHome = () => {
        const activeUsers = adminUsers.filter(u => u.isActive && !u.deactivatedByAdmin).length;
        const pendingApprovalsCount = adminPendingUsers.length;
        const reportedBooksCount = adminModerationBooks.filter(b => b.isReportedForReview).length;
        const newFeedbackCount = feedbackItems.filter(f => f.status === 'new').length;

      return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard title="Total Borrows (incl. Giveaways)" value={kpiData?.totalBorrowsAndGiveaways ?? 0} icon={<ArrowUturnLeftIcon className="w-8 h-8"/>} color="border-purple-500" />
                <AdminStatCard title="Books on Platform" value={kpiData?.totalBooksOnPlatform ?? 0} icon={<BookOpenIcon className="w-8 h-8"/>} color="border-sky-500" />
                <AdminStatCard title="Pending User Approvals" value={pendingApprovalsCount} icon={<UserPlusIcon className="w-8 h-8"/>} color="border-amber-500" />
                <AdminStatCard title="Active Users" value={activeUsers} icon={<UsersIcon className="w-8 h-8"/>} color="border-green-500" />
                <AdminStatCard title="Reported Books" value={reportedBooksCount} icon={<FlagIcon className="w-8 h-8"/>} color="border-yellow-500" />
                <AdminStatCard title="New Feedback" value={newFeedbackCount} icon={<EnvelopeIcon className="w-8 h-8"/>} color="border-blue-500" />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                <div className="flex space-x-2">
                    <AppButton onClick={() => setCurrentAdminSubView('registrationApprovals')} variant="secondary">Review Approvals</AppButton>
                    <AppButton onClick={() => setCurrentAdminSubView('contentModeration')} variant="secondary">Moderate Content</AppButton>
                </div>
            </div>
        </div>
      );
    };
    
    const renderAdminRegistrationApprovals = () => {
        return (
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Pending User Registrations ({adminPendingUsers.length})</h3>
                {adminPendingUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Unit</th>
                                    <th scope="col" className="px-6 py-3">MyGate ID</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminPendingUsers.map(user => (
                                    <tr key={user.id} className="bg-white border-b">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{user.communityUnit}</td>
                                        <td className="px-6 py-4">{user.mygateId}</td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            <AppButton size="sm" variant="confirm" onClick={() => handleApproveRegistration(user.id)}>Approve</AppButton>
                                            <AppButton size="sm" variant="danger" onClick={() => handleRejectRegistration(user.id)}>Reject</AppButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState title="No Pending Approvals" message="All new user registrations have been reviewed." isCompact />}
            </div>
        );
    };
    
    const renderAdminUserManagement = () => {
        const filteredUsers = adminUsers.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(adminUserFilter.toLowerCase()) || user.email.toLowerCase().includes(adminUserFilter.toLowerCase());
            if (adminUserActivityFilter === 'all') return matchesSearch;
            if (adminUserActivityFilter === 'active') return user.isActive && !user.deactivatedByAdmin && matchesSearch;
            if (adminUserActivityFilter === 'deactivated') return !user.isActive && matchesSearch;
            if (adminUserActivityFilter === 'reactivation_requested') return user.reactivationRequested && matchesSearch;
            return false;
        });

        return (
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">User Management</h3>
                 <div className="flex space-x-4 mb-4">
                    <input type="text" placeholder="Filter by name or email..." value={adminUserFilter} onChange={e => setAdminUserFilter(e.target.value)} className="w-full p-2 border rounded-lg" />
                    <select value={adminUserActivityFilter} onChange={e => setAdminUserActivityFilter(e.target.value as any)} className="p-2 border rounded-lg bg-white">
                        <option value="all">All Users</option>
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                        <option value="reactivation_requested">Needs Reactivation</option>
                    </select>
                </div>
                {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                             <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">User Details</th>
                                    <th className="px-6 py-3">Unit</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="bg-white border-b">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <p className="font-semibold">{user.name}</p>
                                            <p className="text-xs text-slate-500 font-normal">{user.email}</p>
                                            <p className="text-xs text-slate-500 font-normal mt-1 flex items-center"><PhoneIcon className="w-3 h-3 mr-1.5"/>{user.phoneNumber}</p>
                                        </td>
                                        <td className="px-6 py-4">{user.communityUnit}</td>
                                        <td className="px-6 py-4"><UserStatusPill user={user} /></td>
                                        <td className="px-6 py-4">
                                            {user.reactivationRequested ? (
                                                <AppButton size="sm" variant="confirm" onClick={() => handleToggleUserActivation(user.id)}>Approve Reactivation</AppButton>
                                            ) : (
                                                <AppButton size="sm" variant={user.isActive ? 'danger' : 'confirm'} onClick={() => handleToggleUserActivation(user.id)}>
                                                    {user.isActive ? 'Deactivate' : 'Reactivate'}
                                                </AppButton>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <EmptyState title="No Users Found" message="No users match the current filter criteria." isCompact />}
            </div>
        );
    };
    
    const renderAdminContentModeration = () => {
         return (
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Content Moderation</h3>
                <div className="flex border-b mb-4">
                    <button onClick={() => setAdminContentFilter('reported')} className={`px-4 py-2 ${adminContentFilter === 'reported' ? 'border-b-2 border-indigo-500 font-semibold' : ''}`}>Reported</button>
                    <button onClick={() => setAdminContentFilter('deactivated')} className={`px-4 py-2 ${adminContentFilter === 'deactivated' ? 'border-b-2 border-indigo-500 font-semibold' : ''}`}>Deactivated</button>
                </div>
                {adminModerationBooks.length > 0 ? (
                    <div className="space-y-4">
                        {adminModerationBooks.map(book => (
                            <div key={book.id} className="border p-4 rounded-lg flex gap-4">
                                <img src={book.coverImageUrl} className="w-16 h-24 object-cover rounded"/>
                                <div className="flex-grow">
                                    <h4 className="font-bold">{book.title}</h4>
                                    <p className="text-sm text-slate-600">by {book.author}</p>
                                    <p className="text-sm text-slate-500">Owner: {getUserById(book.ownerId)?.name}</p>
                                    {book.isReportedForReview && book.reportedByUsers && book.reportedByUsers.length > 0 && (
                                        <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                            <p className="font-semibold text-xs text-yellow-800">Reason for report:</p>
                                            <p className="text-xs italic text-yellow-700">"{book.reportedByUsers[book.reportedByUsers.length - 1].reason}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-2">
                                    {adminContentFilter === 'reported' && <>
                                        <AppButton size="sm" variant="danger" onClick={() => handleAdminDeactivateBook(book.id)}>Deactivate Book</AppButton>
                                        <AppButton size="sm" variant="secondary" onClick={() => handleAdminDismissReport(book.id)}>Dismiss Report</AppButton>
                                    </>}
                                    {adminContentFilter === 'deactivated' && 
                                        <AppButton size="sm" variant="confirm" onClick={() => handleAdminReactivateBook(book.id)}>Reactivate Book</AppButton>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState title={`No ${adminContentFilter} books`} message="This queue is empty." isCompact />}
            </div>
         );
    };

    const renderAdminFeedbackManagement = () => {
        const filteredFeedback = feedbackItems.filter(f => adminFeedbackFilterStatus === 'all' || f.status === adminFeedbackFilterStatus);
      return (
            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">User Feedback</h3>
                <select value={adminFeedbackFilterStatus} onChange={e => setAdminFeedbackFilterStatus(e.target.value as any)} className="mb-4 p-2 border rounded-lg bg-white">
                    <option value="all">All Feedback</option>
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="for_later">For Later</option>
                    <option value="resolved">Resolved</option>
                </select>
                {filteredFeedback.length > 0 ? (
                    <div className="space-y-2">
                        {filteredFeedback.map(fb => (
                            <div key={fb.id} className="border p-3 rounded-lg">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-bold">{fb.subject}</p>
                                        <p className="text-xs text-slate-500">From: {getUserById(fb.userId)?.name || 'Unknown User'} on {new Date(fb.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <select value={fb.status} onChange={e => handleUpdateFeedbackStatus(fb.id, e.target.value as FeedbackStatus)} className="text-xs border rounded bg-white">
                                        <option value="new">New</option>
                                        <option value="read">Read</option>
                                        <option value="for_later">For Later</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">{fb.message}</p>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState title="No feedback" message="No feedback items match the current filter." isCompact/>}
            </div>
      );
    };
    
    const renderEditBookModalContent = () => {
        const book = editBookFormValues;
        if (!book) return null;

        return (
            <div className="space-y-4">
                <FormInput 
                    id="editBookTitle" 
                    label="Book Title" 
                    value={book.title || ''} 
                    onChange={val => setEditBookFormValues(prev => ({...prev, title: val}))} 
                    error={editBookFormErrors.title} 
                    clearError={() => clearValidationErrorsForField('title', 'editBook')} 
                />
                <FormInput 
                    id="editBookAuthor" 
                    label="Author" 
                    value={book.author || ''} 
                    onChange={val => setEditBookFormValues(prev => ({...prev, author: val}))} 
                    error={editBookFormErrors.author} 
                    clearError={() => clearValidationErrorsForField('author', 'editBook')} 
                />
                <FormInputArea 
                    id="editBookDescription" 
                    label="Description" 
                    value={book.description || ''} 
                    onChange={val => setEditBookFormValues(prev => ({...prev, description: val}))} 
                    error={editBookFormErrors.description} 
                    clearError={() => clearValidationErrorsForField('description', 'editBook')} 
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image <span className="text-red-500">*</span></label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="flex-shrink-0 w-24 h-36 bg-slate-100 rounded-md flex items-center justify-center border">
                            {book.coverImageUrl ? 
                                <img src={book.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover rounded-md" /> : 
                                <PhotoIcon className="w-10 h-10 text-slate-300" />
                            }
                        </div>
                        <input type="file" id="editBookCoverImage" accept="image/*" onChange={(e) => {handleCoverImageChange(e, 'edit'); clearValidationErrorsForField('coverImageUrl', 'editBook')}} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    </div>
                     {editBookFormErrors.coverImageUrl && <p className="text-red-500 text-xs mt-1">{editBookFormErrors.coverImageUrl}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="editBookGenre" className="block text-sm font-medium text-gray-700 mb-1">Genre:</label>
                        <select id="editBookGenre" value={book.genre || ''} onChange={e => setEditBookFormValues(prev => ({...prev, genre: e.target.value}))} className={`w-full p-2.5 border bg-white rounded-lg ${editBookFormErrors.genre ? 'border-red-500' : 'border-gray-300'}`}>
                            {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                         {editBookFormErrors.genre && <p className="text-red-500 text-xs mt-1">{editBookFormErrors.genre}</p>}
                    </div>
                    <div>
                        <label htmlFor="editBookLanguage" className="block text-sm font-medium text-gray-700 mb-1">Language:</label>
                        <select id="editBookLanguage" value={book.language || ''} onChange={e => setEditBookFormValues(prev => ({...prev, language: e.target.value}))} className={`w-full p-2.5 border bg-white rounded-lg ${editBookFormErrors.language ? 'border-red-500' : 'border-gray-300'}`}>
                            {BOOK_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        {editBookFormErrors.language && <p className="text-red-500 text-xs mt-1">{editBookFormErrors.language}</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="editBookIsGiveaway" checked={book.isGiveaway || false} onChange={e => setEditBookFormValues(prev => ({...prev, isGiveaway: e.target.checked}))} className="h-4 w-4 text-indigo-600 rounded" />
                    <label htmlFor="editBookIsGiveaway" className="text-sm font-medium text-gray-700">This is a giveaway (will not be returned)</label>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <AppButton variant="secondary" onClick={() => setShowEditBookModal(false)}>Cancel</AppButton>
                    <AppButton onClick={handleUpdateBookDetails} disabled={authActionInProgress}>
                        {authActionInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Save Changes'}
                    </AppButton>
                </div>
            </div>
        );
    };

    const renderDeleteBookModalContent = () => (
        <div>
            <p className="text-slate-600 mb-4">Are you sure you want to permanently delete this book from your library? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={() => setShowDeleteBookModal(false)}>Cancel</AppButton>
                <AppButton variant="danger" onClick={confirmDeleteBookLogic}>Confirm Delete</AppButton>
            </div>
        </div>
    );

    const renderReportBookModalContent = () => (
        <div className="space-y-4">
            {reportBookError && <AlertToast id="report-book-error" type="error" message={reportBookError} onClose={() => setReportBookError(null)} />}
            <FormInputArea 
                id="reportReason" 
                label="Reason for reporting" 
                value={reportBookReason} 
                onChange={setReportBookReason} 
                placeholder="Please provide a clear reason for reporting this book (e.g., inappropriate content, incorrect details, etc.)." 
                rows={4}
                error={reportBookError ? ' ' : undefined} // Just to show red border without text
                clearError={() => setReportBookError(null)}
            />
            <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={handleCloseReportModal}>Cancel</AppButton>
                <AppButton variant="danger" onClick={handleConfirmReportBook} disabled={!reportBookReason.trim()}>Submit Report</AppButton>
            </div>
        </div>
    );

    const renderDeactivateProfileModalContent = () => (
        <div>
            <p className="text-slate-600 mb-4">Are you sure you want to deactivate your account? Your profile and book listings will be hidden from the community. You can request reactivation later.</p>
            <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={() => setShowDeactivateProfileModal(false)}>Cancel</AppButton>
                <AppButton variant="danger" onClick={handleSelfDeactivateAccount}>Confirm Deactivation</AppButton>
            </div>
        </div>
    );

    const renderDeleteProfileModalContent = () => (
        <div>
            <p className="text-slate-600 mb-4 font-bold text-red-700">This is your final confirmation. Deleting your account is permanent and cannot be reversed.</p>
            <p className="text-slate-600 mb-4">All your books, transaction history, and personal data will be erased.</p>
            <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={() => setShowDeleteProfileModal(false)}>Cancel</AppButton>
                <AppButton variant="danger" onClick={handleDeleteProfile}>I Understand, Delete My Account</AppButton>
            </div>
        </div>
    );

    const renderForgotPasswordModalContent = () => (
        <div className="space-y-4">
             <p className="text-sm text-slate-600">Enter your email address and we'll send you instructions to reset your password.</p>
            {resetPasswordError && <AlertToast id="reset-error" type="error" message={resetPasswordError} onClose={() => setResetPasswordError('')} />}
            <AuthInput 
                id="emailForReset"
                label="Email Address"
                value={emailForReset}
                onChange={setEmailForReset}
                error={resetPasswordError ? ' ' : undefined}
                placeholder="Your registered email"
                clearError={() => setResetPasswordError('')}
            />
            <div className="flex justify-end gap-2">
                <AppButton variant="secondary" onClick={() => setShowForgotPasswordModal(false)}>Cancel</AppButton>
                <AppButton onClick={handleForgotPasswordRequest} disabled={authActionInProgress}>
                    {authActionInProgress ? 'Sending...' : 'Send Reset Instructions'}
                </AppButton>
            </div>
        </div>
    );

    const renderResetPasswordModalContent = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">Please enter and confirm your new password.</p>
            {resetPasswordError && <AlertToast id="reset-error" type="error" message={resetPasswordError} onClose={() => setResetPasswordError('')} />}
            <AuthInput 
                id="newPassword"
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter a new secure password"
                clearError={() => setResetPasswordError('')}
            />
            <PasswordStrengthMeter password={newPassword} />
            <AuthInput 
                id="confirmNewPassword"
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Confirm your new password"
                clearError={() => setResetPasswordError('')}
            />
            <div className="flex justify-end gap-2 mt-4">
                <AppButton variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</AppButton>
                <AppButton onClick={handleResetPasswordSubmit} disabled={authActionInProgress}>
                    {authActionInProgress ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto"/> : 'Reset Password'}
                </AppButton>
            </div>
        </div>
    );
    
    // Main return statement
    return (
      <div className={`min-h-screen ${isAdminMode ? 'bg-slate-200' : 'bg-slate-100'}`}>
        {isAdminMode ? <AdminHeader onLogout={handleLogout} onNavigateToDashboard={() => setCurrentAdminSubView('dashboardHome')} pendingApprovalsCount={adminPendingUsers.length}/> : renderHeader()}
        
        <main className={`container mx-auto p-4 sm:p-6 ${isAdminMode ? '' : 'space-y-6'}`}>
          {isLoading && currentView !== 'auth' && (
            <div className="text-center py-10">
              <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
              <p className="mt-2 text-slate-600">Loading your BookVerse...</p>
            </div>
          )}
          
          {!isLoading && (
            <>
              {currentView === 'auth' && <div className="pt-8 sm:pt-16">{renderAuthView()}</div>}
              
              {currentUser && !isAdminMode && (
                <>
                  {renderNav()}
                  <div className="pt-6">
                    {currentView === 'myLibrary' && renderMyLibraryView()}
                    {currentView === 'communityBooks' && renderCommunityBooksView()}
                    {currentView === 'myActivityAndOutgoing' && renderMyActivityAndOutgoingView()}
                    {currentView === 'myLendingActivity' && renderMyLendingActivityView()}
                    {currentView === 'editProfile' && renderEditProfileView()}
                    {currentView === 'submitFeedback' && renderSubmitFeedbackView()}
                    {currentView === 'tutorialFAQ' && renderTutorialFAQView()}
                    {currentView === 'messages' && renderMessagesView()}
                    {currentView === 'wishlist' && renderWishlistView()}
                  </div>
                </>
              )}

              {currentUser && isAdminMode && (
                <div className="flex gap-6">
                    <div className="w-1/5 bg-white p-4 rounded-lg shadow-md flex-shrink-0">
                        <h3 className="font-bold text-lg mb-4">Admin Menu</h3>
                        <ul className="space-y-1">
                            {[
                                { view: 'dashboardHome' as AdminSubView, label: 'Overview', icon: <HomeIcon className="w-5 h-5 mr-2" /> },
                                { view: 'registrationApprovals' as AdminSubView, label: 'User Approvals', icon: <UserPlusIcon className="w-5 h-5 mr-2" />, badge: adminPendingUsers.length },
                                { view: 'userManagement' as AdminSubView, label: 'User Management', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
                                { view: 'contentModeration' as AdminSubView, label: 'Content Moderation', icon: <ShieldExclamationIcon className="w-5 h-5 mr-2" /> },
                                { view: 'feedbackManagement' as AdminSubView, label: 'Feedback', icon: <EnvelopeIcon className="w-5 h-5 mr-2" /> },
                            ].map(item => (
                                <li key={item.view}>
                                    <button onClick={() => setCurrentAdminSubView(item.view)} className={`w-full text-left flex items-center p-2 rounded-md transition-colors text-sm font-medium ${currentAdminSubView === item.view ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                                        {item.icon} {item.label}
                                        {item.badge && item.badge > 0 ? <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span> : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-4/5">
                        {currentAdminSubView === 'dashboardHome' && renderAdminDashboardHome()}
                        {currentAdminSubView === 'registrationApprovals' && renderAdminRegistrationApprovals()}
                        {currentAdminSubView === 'userManagement' && renderAdminUserManagement()}
                        {currentAdminSubView === 'contentModeration' && renderAdminContentModeration()}
                        {currentAdminSubView === 'feedbackManagement' && renderAdminFeedbackManagement()}
                    </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Modals Section */}
        {magnifiedImageUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setMagnifiedImageUrl(null)}>
                <img src={magnifiedImageUrl} alt="Magnified cover" className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-lg"/>
            </div>
        )}
        {showBookDetailsModal && (
          <Modal title={selectedBookForDetails?.title || "Book Details"} onClose={handleCloseBookDetailsModal}>
              {renderBookDetailsModalContent()}
          </Modal>
        )}
        {showEditBookModal && editingBookId && (
            <Modal title="Edit Book Details" onClose={() => setShowEditBookModal(false)}>
                {renderEditBookModalContent()}
            </Modal>
        )}
         {showDeleteBookModal && (
            <Modal title="Confirm Deletion" onClose={() => setShowDeleteBookModal(false)} size="md">
                {renderDeleteBookModalContent()}
            </Modal>
        )}
        {showReportBookModal && (
            <Modal title="Report a Book" onClose={handleCloseReportModal}>
                {renderReportBookModalContent()}
            </Modal>
        )}
        {showDeactivateProfileModal && (
            <Modal title="Deactivate Account" onClose={() => setShowDeactivateProfileModal(false)} size="md">
                {renderDeactivateProfileModalContent()}
            </Modal>
        )}
        {showDeleteProfileModal && (
            <Modal title="Permanently Delete Account" onClose={() => setShowDeleteProfileModal(false)} size="md">
                {renderDeleteProfileModalContent()}
            </Modal>
        )}
        {showForgotPasswordModal && (
            <Modal title="Forgot Password" onClose={() => setShowForgotPasswordModal(false)} size="md">
                {renderForgotPasswordModalContent()}
            </Modal>
        )}
        {showResetPasswordModal && (
            <Modal title="Reset Your Password" onClose={() => setShowResetPasswordModal(false)} size="md">
                {renderResetPasswordModalContent()}
            </Modal>
        )}

        {/* Toast Notifications Container */}
        <div className="fixed top-5 right-5 w-full max-w-sm z-50 space-y-2">
            {toastNotifications.map((toast) => (
                <AlertToast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>
      </div>
    );
};

export default App;
