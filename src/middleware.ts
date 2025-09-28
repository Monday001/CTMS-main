
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

// let hasRedirected = false;

// export function middleware(request: NextRequest) {np
//   const path = request.nextUrl.pathname;
//   const isPublicPath = path === '/login' || path === '/signup' || path === '/';

//   const token = request.cookies.get('token')?.value || '';

//   console.log('Token:', token);


//   if(isPublicPath && token) {
//     return NextResponse.redirect(new URL('/login', request.nextUrl))
//   }
//   if (hasRedirected) {
//     console.log('Already redirected, skipping');
//     return NextResponse.next();
//   }
//   if (!isPublicPath && !token) {
//     return NextResponse.redirect(new URL('/', request.nextUrl))
//   }

//   try {
//     console.log('Decoding token');
//     const decodedToken = jwt.verify(token, process.env.JWT_TOKEN_SECRET!) as { role: string };
//     switch (decodedToken.role.toUpperCase()) {
//       case 'STUDENT':
//         if (!request.nextUrl.pathname.startsWith('/Admin')) {
//           console.log('Redirecting to /Student');
//           hasRedirected = true;
//           return NextResponse.redirect(new URL('/Student', request.url));
//         }
//         break;
//       case 'ADMIN':
//         if (!request.nextUrl.pathname.startsWith('/Student')) {
//           console.log('Redirecting to /Admin');
//           hasRedirected = true;
//           return NextResponse.redirect(new URL('/Admin', request.url));
//         }
//         break;
//       default:
//         console.log('Redirecting to /');
//         hasRedirected = true;
//         return NextResponse.redirect(new URL('/', request.url));
//     }
//   } catch (error: any) {
//     if (error instanceof TokenExpiredError) {
//       console.log('Token expired');
//     } else if (error instanceof JsonWebTokenError) {
//       console.log('Invalid token');
//     } else {
//       console.log('Unknown error:', error);
//     }
//     console.log('Redirecting to /');
//     hasRedirected = true;
//     return NextResponse.redirect(new URL('/', request.url));
//   }
// }

// export const config = {
//   matcher: ['/', '/login', '/signup', '/Student', '/Admin'],
// };


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

let hasRedirected = false;

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path === '/signup' || path === '/';

  const token = request.cookies.get('token')?.value || '';

  console.log('Token:', token);
  
}

export const config = {
  matcher: ['/', '/login', '/signup', '/Student', '/Admin'],
};


