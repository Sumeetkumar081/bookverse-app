
import React from 'react';
import { Book, User, OverdueInfo, AppButtonProps } from '../types'; // Added AppButtonProps
import { 
  ArrowRightOnRectangleIcon, CheckCircleIcon, XCircleIcon, ArrowUturnLeftIcon,
  ClockIcon, HandThumbUpIcon, HandThumbDownIcon, CheckBadgeIcon, BookOpenIcon as DefaultBookIcon,
  HomeModernIcon, UserCircleIcon, TrashIcon, PauseIcon, PlayIcon, GiftIcon,
  FlagIcon, ShieldExclamationIcon, InformationCircleIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon // Added for Edit
} from '../constants'; 

interface BookCardProps {
  book: Book;
  owner?: User;
  borrower?: User; 
  requester?: User; 
  currentUser: User | null;
  onrequestbook: (bookId: string) => void;
  onMarkAsReturned: (bookId: string) => void;
  onApproveRequest: (bookId: string, requesterId: string) => void;
  onRejectRequest: (bookId: string, requesterId: string) => void;
  onRevokeApproval?: (bookId: string) => void; // New for owner to revoke approval
  onConfirmPickup: (bookId: string) => void; 
  onCancelRequest?: (bookId: string) => void; 
  onShowBookDetails?: (bookId: string) => void;
  onDeleteBook?: (bookId: string) => void;
  onTogglePauseBook?: (bookId: string) => void;
  onOpenReportModal?: (bookId: string) => void; 
  onRemindBorrower?: (bookId: string, borrowerId: string) => void; 
  onToggleWishlist?: (bookId: string) => void; 
  onInitiateChat?: (otherUserId: string) => void;
  onEditBook?: (bookId: string) => void; // New for editing book
  onMagnifyImage?: (imageUrl: string) => void;
  isCompactView?: boolean; 
  className?: string;
  showOwnerDetailsInCard?: boolean; 
  overdueInfo?: OverdueInfo;
  viewContext?: 'myLibrary' | 'communityBooks' | 'myActivityAndOutgoing' | 'adminContentModeration' | 'myLendingActivity' | 'wishlist';
  AppButtonComponent: React.FC<AppButtonProps>; 
  children?: React.ReactNode;
  hasReachedRequestLimit?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book, owner, borrower, requester, currentUser,
  onrequestbook, onMarkAsReturned, onApproveRequest, onRejectRequest, onRevokeApproval, onConfirmPickup, onCancelRequest, onShowBookDetails,
  onDeleteBook, onTogglePauseBook, onOpenReportModal, onRemindBorrower, onToggleWishlist, onInitiateChat, onEditBook,
  onMagnifyImage, isCompactView = false, className, showOwnerDetailsInCard = false, overdueInfo, viewContext, AppButtonComponent,
  children, hasReachedRequestLimit = false
}) => {
  if (!currentUser) return null;

  const AppButton = AppButtonComponent;


  const isOwnerViewing = currentUser.id === book.ownerId;
  const isBorrowerViewing = currentUser.id === book.borrowedByUserId;
  const isRequesterViewing = currentUser.id === book.requestedByUserId;
  const isInWishlist = currentUser.wishlistBookIds?.includes(book.id) || false;

  const isBookGivenAway = book.borrowRequestStatus === 'giveaway_completed';

  const isEffectivelyAvailableForBorrow = 
    !book.isPausedByOwner && 
    !book.isDeactivatedByAdmin && 
    !book.borrowedByUserId && 
    book.borrowRequestStatus !== 'pending' && 
    book.borrowRequestStatus !== 'approved' && 
    !isBookGivenAway &&
    book.isAvailable; 
  
  const canRequest = currentUser && !currentUser.isAdmin && currentUser.isActive && currentUser.isApproved && isEffectivelyAvailableForBorrow && !isOwnerViewing && !hasReachedRequestLimit;
  const canOwnerMarkAsReturned = isOwnerViewing && book.borrowedByUserId && book.borrowRequestStatus === 'pickup_confirmed' && !book.isDeactivatedByAdmin && !book.isGiveaway;
  const canOwnerActOnRequest = isOwnerViewing && book.requestedByUserId && book.borrowRequestStatus === 'pending' && !book.isDeactivatedByAdmin;
  const canRequesterConfirmPickup = isRequesterViewing && currentUser.isActive && currentUser.isApproved && book.borrowRequestStatus === 'approved';
  const canRequesterCancelRequest = isRequesterViewing && currentUser.isActive && currentUser.isApproved && (book.borrowRequestStatus === 'pending' || book.borrowRequestStatus === 'approved') && onCancelRequest;
  const canOwnerRevokeApproval = isOwnerViewing && book.borrowRequestStatus === 'approved' && onRevokeApproval;

  
  const canOwnerManageBook = isOwnerViewing && 
                             !book.borrowedByUserId && 
                             book.borrowRequestStatus !== 'pending' && 
                             book.borrowRequestStatus !== 'approved' && 
                             book.borrowRequestStatus !== 'pickup_confirmed' && 
                             !book.isDeactivatedByAdmin && 
                             !isBookGivenAway;

  const canEditBook = canOwnerManageBook && onEditBook; // Specific condition for edit

  const canUserReportBook = !isOwnerViewing && !currentUser.isAdmin && onOpenReportModal && viewContext === 'communityBooks' && !book.isDeactivatedByAdmin && !book.isReportedForReview && currentUser.isActive && currentUser.isApproved && !isBookGivenAway;
  const canOwnerRemindBorrower = isOwnerViewing && book.borrowedByUserId && book.borrowRequestStatus === 'pickup_confirmed' && overdueInfo?.isOverdue && onRemindBorrower && !book.isDeactivatedByAdmin && !book.isGiveaway;
  
  const canToggleWishlist = onToggleWishlist && !isOwnerViewing && !currentUser.isAdmin && viewContext !== 'adminContentModeration' && currentUser.isActive && currentUser.isApproved;

  let chatTargetUserId: string | null = null;
  if (isOwnerViewing && (book.borrowedByUserId || book.requestedByUserId)) chatTargetUserId = book.borrowedByUserId || book.requestedByUserId || null;
  else if (!isOwnerViewing && owner) chatTargetUserId = owner.id;
  
  const canInitiateChat =
    onInitiateChat &&
    chatTargetUserId &&
    currentUser.isActive &&
    currentUser.isApproved &&
    (viewContext === 'myActivityAndOutgoing' || viewContext === 'myLendingActivity') &&
    (book.borrowRequestStatus === 'approved' || book.borrowRequestStatus === 'pickup_confirmed');


  let statusPillConfig: { text: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; bgColor: string; textColor: string; subText?: string; } | null = null;
  
  if (book.isDeactivatedByAdmin) {
    statusPillConfig = { text: 'Admin Deactivated', Icon: ShieldExclamationIcon, bgColor: 'bg-red-200', textColor: 'text-red-800', subText: "This book is currently hidden by admin." };
  } else if (isBookGivenAway) {
    statusPillConfig = { text: 'Given Away', Icon: GiftIcon, bgColor: 'bg-rose-100', textColor: 'text-rose-700' };
     if (isOwnerViewing && borrower) statusPillConfig.subText = `To: ${borrower.name} (${borrower.communityUnit})`;
     else if (isBorrowerViewing && owner) statusPillConfig.subText = `From: ${owner.name} (${owner.communityUnit})`;
  } else if (book.isPausedByOwner) { 
    statusPillConfig = { text: 'Sharing Paused', Icon: PauseIcon, bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    if (isOwnerViewing) statusPillConfig.subText = "You've paused this book.";
  } else if (book.borrowRequestStatus === 'pending') {
    statusPillConfig = { text: 'Request Pending', Icon: ClockIcon, bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
    if (isOwnerViewing && requester) statusPillConfig.subText = `From: ${requester.name} (${requester.communityUnit})`;
    else if (isRequesterViewing) statusPillConfig.subText = `Your request.`;
    else statusPillConfig.subText = 'Requested by another member.'
  } else if (book.borrowRequestStatus === 'approved') {
    statusPillConfig = { text: 'Awaiting Pickup', Icon: CheckBadgeIcon, bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' };
    if (isOwnerViewing && requester) statusPillConfig.subText = `For: ${requester.name} (${requester.communityUnit})`;
    else if (isRequesterViewing) statusPillConfig.subText = `Your request approved.`;
    else statusPillConfig.subText = 'Awaiting pickup by another member.'
  } else if (book.borrowRequestStatus === 'pickup_confirmed') {
    statusPillConfig = { text: 'Borrowed', Icon: UserCircleIcon, bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
    if (isOwnerViewing && borrower) {
       statusPillConfig.subText = `By: ${borrower.name} (${borrower.communityUnit})`;
    } else if (isBorrowerViewing) {
        statusPillConfig.subText = "You're borrowing this.";
    } else {
       statusPillConfig.subText = `On loan.`;
    }
  } else if (book.isReportedForReview && (viewContext === 'adminContentModeration' || viewContext === 'communityBooks') && !book.isDeactivatedByAdmin) {
    statusPillConfig = { text: 'Reported', Icon: FlagIcon, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', subText: "Awaiting admin review." };
  } else if (isEffectivelyAvailableForBorrow) { 
    statusPillConfig = { text: book.isGiveaway ? 'For Giveaway' : 'Available', Icon: book.isGiveaway ? GiftIcon : CheckCircleIcon, bgColor: book.isGiveaway ? 'bg-rose-100' : 'bg-green-100', textColor: book.isGiveaway ? 'text-rose-700' : 'text-green-700' };
  } else if (book.borrowRequestStatus === 'returned' && isOwnerViewing) {
     statusPillConfig = { text: 'Returned', Icon: ArrowUturnLeftIcon, bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
  }


  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button, img, .cover-image-container')) {
      return;
    }
    if (onShowBookDetails) {
      onShowBookDetails(book.id);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
       if (e.target instanceof HTMLElement && e.target.closest('button, img, .cover-image-container')) {
        return; 
      }
      e.preventDefault();
      handleCardClick(e);
    }
  };


  const renderCoverImage = () => (
    <div 
      className="relative w-full h-32 sm:h-36 overflow-hidden rounded-t-lg bg-slate-200 group/image cover-image-container" 
      onClick={(e) => {
        e.stopPropagation();
        if (onMagnifyImage && book.coverImageUrl) {
            onMagnifyImage(book.coverImageUrl);
        } else if (onShowBookDetails) {
            onShowBookDetails(book.id);
        }
      }}
    >
      {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={`Cover of ${book.title}`} className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105" onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none'; 
            const parent = target.parentElement;
            if (parent) { 
              const fallback = parent.querySelector('.fallback-icon-container');
              if (fallback) fallback.classList.remove('hidden');
            }
          }} />
      ) : null}
      {(!book.coverImageUrl || (typeof book.coverImageUrl === 'string' && book.coverImageUrl.trim() === '')) && (
         <div className="fallback-icon-container w-full h-full flex items-center justify-center bg-slate-100">
            <DefaultBookIcon className="w-10 h-10 text-slate-300" />
        </div>
      )}
      <div className="fallback-icon-container hidden w-full h-full flex items-center justify-center bg-slate-100">
          <DefaultBookIcon className="w-10 h-10 text-slate-300" />
      </div>
       {canToggleWishlist && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(book.id); }}
          className={`absolute top-1.5 right-1.5 p-1.5 rounded-full transition-colors duration-200 z-10 ${isInWishlist ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-black/30 text-white hover:bg-red-500'}`}
          aria-label={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <HeartIcon className="w-4 h-4" solid={isInWishlist} />
        </button>
      )}
    </div>
  );

  return (
    <div 
      className={`bg-white shadow-lg rounded-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group ${className} ${book.isDeactivatedByAdmin ? 'opacity-70 border-2 border-red-300' : ''}  ${book.isReportedForReview && viewContext === 'adminContentModeration' ? 'border-2 border-yellow-400' : ''} ${onShowBookDetails ? 'cursor-pointer' : ''}`}
      onClick={onShowBookDetails ? handleCardClick : undefined}
      onKeyDown={onShowBookDetails ? handleCardKeyDown : undefined}
      role={onShowBookDetails ? "button" : undefined}
      tabIndex={onShowBookDetails ? 0 : undefined}
      aria-label={onShowBookDetails ? `View details for ${book.title}${statusPillConfig?.subText ? ` (${statusPillConfig.subText})` : ''}`: undefined}
    >
      {renderCoverImage()}
      <div className="p-2.5 sm:p-3 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
            <h3 className="text-sm sm:text-base font-bold text-indigo-700 group-hover:text-indigo-800 transition-colors mb-0.5 truncate flex-grow mr-1" title={book.title}>{book.title}</h3>
        </div>
        <p className="text-slate-500 mb-1 text-xs sm:text-sm">by {book.author}</p>
        <p className="text-xs text-purple-600 font-medium mb-0.5">Genre: {book.genre}</p>
        <p className="text-xs text-blue-600 font-medium mb-1.5">Language: {book.language}</p>
        
        {book.isGiveaway && !isBookGivenAway && !book.isDeactivatedByAdmin && !statusPillConfig?.text.toLowerCase().includes('giveaway') && (
            <p className="text-xs text-rose-600 font-semibold mb-1 flex items-center"><GiftIcon className="w-3 h-3 mr-1 text-rose-500"/>Giveaway</p>
        )}
        
        {statusPillConfig && (
          <div className="my-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusPillConfig.bgColor} ${statusPillConfig.textColor}`}>
              <statusPillConfig.Icon className="w-3 h-3 mr-1" /> {statusPillConfig.text}
            </span>
            {statusPillConfig.subText && <p className="text-xs text-slate-600 mt-0.5 italic">{statusPillConfig.subText}</p>}
          </div>
        )}

        {isOwnerViewing && viewContext === 'myLibrary' && book.borrowedByUserId && book.borrowRequestStatus === 'pickup_confirmed' && borrower && (
             <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-600 text-xs mb-0.5">Lent To:</p>
                <p className="flex items-center text-xs"><UserCircleIcon className="w-3 h-3 mr-1 text-slate-400"/>{`${borrower.name} (${borrower.communityUnit})`}</p>
            </div>
        )}

        {isCompactView && showOwnerDetailsInCard && owner && viewContext !== 'myLendingActivity' && !isBookGivenAway && ( 
             <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
                <p className="font-semibold text-slate-600 text-xs mb-0.5">Owner:</p>
                <p className="flex items-center text-xs"><UserCircleIcon className="w-3 h-3 mr-1 text-slate-400"/>{`${owner.name} (${owner.communityUnit})`}</p>
            </div>
        )}
        
        {isCompactView && overdueInfo && (
          <div className={`my-1.5 text-xs p-1.5 rounded-md ${overdueInfo.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
            <p className="font-semibold text-slate-700 flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" />
                Borrowed: {overdueInfo.daysBorrowed} day(s) ago
            </p>
            {overdueInfo.isOverdue && (
              <p className="text-red-600 font-bold mt-0.5">Overdue! Please consider returning.</p>
            )}
          </div>
        )}

        {children}
        <div className="flex-grow"></div> 
        
        <div className="mt-auto pt-2 space-y-1.5">
          {canRequest && (
            <AppButton onClick={() => onrequestbook(book.id)} fullWidth icon={<ArrowRightOnRectangleIcon className="w-4 h-4 mr-1"/>}>Request Book</AppButton>
          )}
          {hasReachedRequestLimit && !isOwnerViewing && isEffectivelyAvailableForBorrow && (
            <div className="text-xs text-center text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
               <InformationCircleIcon className="w-4 h-4 mx-auto mb-1" />
               Request limit reached. Return a book to borrow more.
            </div>
          )}
          {canOwnerMarkAsReturned && (
            <AppButton onClick={() => onMarkAsReturned(book.id)} fullWidth icon={<ArrowUturnLeftIcon className="w-4 h-4 mr-1"/>} variant="confirm">Mark as Returned</AppButton>
          )}
          {canOwnerActOnRequest && requester && (
            <div className="flex gap-1.5">
              <AppButton onClick={() => onApproveRequest(book.id, requester.id)} flex1 icon={<HandThumbUpIcon className="w-4 h-4 mr-1"/>} variant="confirm" size="sm">Approve</AppButton>
              <AppButton onClick={() => onRejectRequest(book.id, requester.id)} flex1 icon={<HandThumbDownIcon className="w-4 h-4 mr-1"/>} variant="danger" size="sm">Reject</AppButton>
            </div>
          )}
          {canRequesterConfirmPickup && (
            <AppButton onClick={() => onConfirmPickup(book.id)} fullWidth icon={<CheckCircleIcon className="w-4 h-4 mr-1"/>} variant="confirm">Confirm Pickup</AppButton>
          )}
           {canRequesterCancelRequest && (
            <AppButton onClick={() => onCancelRequest(book.id)} fullWidth icon={<XCircleIcon className="w-4 h-4 mr-1"/>} variant="secondary">Cancel Request</AppButton>
          )}
          {canOwnerRevokeApproval && (
            <AppButton onClick={() => onRevokeApproval(book.id)} fullWidth icon={<XCircleIcon className="w-4 h-4 mr-1" />} variant="danger">Revoke Approval</AppButton>
          )}
          
          {canOwnerManageBook && onTogglePauseBook && (
            <AppButton onClick={() => onTogglePauseBook(book.id)} fullWidth variant="secondary" icon={book.isPausedByOwner ? <PlayIcon className="w-4 h-4 mr-1"/> : <PauseIcon className="w-4 h-4 mr-1"/>}>
                {book.isPausedByOwner ? 'Resume Sharing' : 'Pause Sharing'}
            </AppButton>
          )}

          {canEditBook && (
            <AppButton onClick={() => onEditBook(book.id)} fullWidth variant="secondary" icon={<PencilSquareIcon className="w-4 h-4 mr-1" />}>
              Edit Details
            </AppButton>
          )}
          
          {canOwnerManageBook && onDeleteBook && (
             <AppButton onClick={() => onDeleteBook(book.id)} fullWidth variant="danger" icon={<TrashIcon className="w-4 h-4 mr-1"/>} >Delete Book</AppButton>
          )}

          {canUserReportBook && (
            <button onClick={() => onOpenReportModal(book.id)} className="w-full text-xs text-slate-500 hover:text-red-600 flex items-center justify-center pt-2 gap-1">
              <FlagIcon className="w-3 h-3"/>Report Listing
            </button>
          )}
          {canOwnerRemindBorrower && book.borrowedByUserId && (
            <AppButton onClick={() => onRemindBorrower(book.id, book.borrowedByUserId!)} variant="secondary" fullWidth size="sm">Remind Borrower</AppButton>
          )}
          {canInitiateChat && chatTargetUserId && (
             <AppButton onClick={() => onInitiateChat(chatTargetUserId)} fullWidth icon={<ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 mr-1"/>} variant="secondary">Chat</AppButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
