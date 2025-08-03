'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { CartIcon } from './IconComponents';
import ClientOnly from './ClientOnly';

const Header: React.FC = () => {
  const { 
    restaurantName, headerBgColor, headerTextColor, cart, orders, authStatus, logout,
    isDataLoaded, logoUrl, logoType, textColor
  } = useAppContext();
  const pathname = usePathname();
  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  const navLinkClass = (href: string): string =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
      pathname === href ? 'bg-black/20' : 'hover:bg-black/10'
    }`;
  
  const buttonClass = 'px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-black/10';
  const isCustomerView = pathname === '/';

  if (!isDataLoaded) {
    return (
        <header className="shadow-md sticky top-0 z-40 bg-gray-200 animate-pulse">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="h-6 w-48 bg-gray-300 rounded"></div>
                    <div className="flex items-center space-x-4"><div className="h-6 w-20 bg-gray-300 rounded"></div><div className="h-6 w-20 bg-gray-300 rounded"></div></div>
                </div>
            </div>
        </header>
    );
  }

  const dynamicTextColor = logoType === 'logo' ? headerTextColor : textColor;

  return (
    <header 
      className="shadow-md sticky top-0 z-40 transition-colors duration-500 backdrop-blur-sm"
      style={{ backgroundColor: headerBgColor }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex-shrink-0">
            <div className="flex items-center">
                {logoType === 'logo' && logoUrl ? (
                    <img src={logoUrl} alt={`${restaurantName} Logo`} className="h-10 w-auto" />
                ) : (
                    <span className="text-2xl font-bold transition-colors duration-500" style={{ color: textColor }}>
                        {restaurantName}
                    </span>
                )}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/" className={navLinkClass('/')} style={{ color: dynamicTextColor }}>Menu</Link>
            {authStatus.isAuthenticated && (authStatus.role === 'admin') && (
              <>
                <Link href="/waiter" className={navLinkClass('/waiter')} style={{ color: dynamicTextColor }}>
                    Waiter View
                    <ClientOnly>{orders.length > 0 && (<span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs rounded-full">{orders.length}</span>)}</ClientOnly>
                </Link>
                <Link href="/admin" className={navLinkClass('/admin')} style={{ color: dynamicTextColor }}>Admin</Link>
              </>
            )}
             {authStatus.isAuthenticated && (authStatus.role === 'waiter') && (
                <Link href="/waiter" className={navLinkClass('/waiter')} style={{ color: dynamicTextColor }}>
                    Waiter View
                    <ClientOnly>{orders.length > 0 && (<span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs rounded-full">{orders.length}</span>)}</ClientOnly>
                </Link>
            )}
            
            {authStatus.isAuthenticated ? (
               <button onClick={logout} className={buttonClass} style={{ color: dynamicTextColor }}>Logout</button>
            ) : (
                // --- THIS IS THE MODIFIED LINK ---
                <Link href="/login?role=waiter" className={navLinkClass('/login')}>
                  <span style={{ color: dynamicTextColor }}>Waiter Login</span>
                </Link>
            )}
          </nav>
          
          <ClientOnly>
            {isCustomerView && (
              <button onClick={() => {}} className="relative">
                <CartIcon className="h-6 w-6" style={{ color: dynamicTextColor }}/>
                {totalItemsInCart > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 bg-brand-secondary text-white text-xs rounded-full">
                    {totalItemsInCart}
                  </span>
                )}
              </button>
            )}
          </ClientOnly>
        </div>
      </div>
    </header>
  );
};

export default Header;