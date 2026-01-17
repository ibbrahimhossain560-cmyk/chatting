# Admin System Documentation

## Overview
This chat application now includes a comprehensive admin dashboard with user management, badge system, username management, and premium user controls.

---

## Accessing the Admin Panel

### URL
Navigate to: **`/admin`**

### Login Credentials
- **Password**: `nafijpro++`
- Password is stored in `.env` file as `ADMIN_PASSWORD`
- The admin login page will prompt for the password before granting access

---

## Features

### 1. Dashboard Statistics
The admin dashboard displays real-time statistics:
- **Total Users**: Total number of registered users
- **Premium Users**: Count of users with active premium subscriptions
- **New Users**: Users registered in the last 30 days
- **Total Messages**: Total messages sent across the platform
- **Banned Users**: Count of currently banned users

### 2. User Management

#### Search & Filter
- Search users by name, username, or email
- Filter users by status:
  - All Users
  - Premium Only
  - Admin Badges
  - Banned Users

#### User Actions (Per User)
Each user row has a dropdown menu with the following options:

##### **Assign Badge**
- **Admin Badges** (Admin-only assignment):
  - 🛡️ **Admin** - Red-orange gradient shield
  - 🛡️ **Moderator** - Purple-pink gradient shield
  - ⭐ **Founder** - Gold star
  - 💻 **Developer** - Cyan-blue code symbol
  - 💖 **Partner** - Emerald heart

- **Premium Badges** (Available to premium users):
  - ✓ **Verified** - Blue checkmark circle
  - ⭐ **Premium** - Gold star
  - 👑 **VIP** - Violet hexagon
  - ⭐ **Star** - Pink star
  - 💎 **Diamond** - Cyan diamond
  - 👑 **Crown** - Yellow crown

- To assign: Click "Assign Badge" → Select badge type → Click "Assign Badge"
- To remove: Click "Remove Badge" button

##### **Toggle Premium**
- Make any user premium or remove premium status
- Premium duration options:
  - 7 days
  - 30 days
  - 90 days
  - 1 year
  - Lifetime
- Premium users get a ✨ sparkle indicator
- Premium users can select from premium badge collection
- Admins can revoke premium status instantly

##### **Reset Password**
- Reset password for users who forgot their credentials
- Find user by username or email
- Enter new password (minimum 6 characters)
- User can login with new password immediately

##### **Change Username**
- Admin can change any user's username without restrictions
- Regular users can only change username once every 30 days
- Username requirements:
  - 3-20 characters
  - Lowercase letters, numbers, and underscores only
  - Must be unique
- Real-time validation ensures no duplicates

##### **Ban/Unban User**
- Ban users who violate policies
- Provide a ban reason (optional but recommended)
- Banned users cannot:
  - Login to the application
  - Send or receive messages
  - Make voice/video calls
- Unban to restore full access

##### **Delete User**
- Permanently remove user account
- Also deletes all messages sent by the user
- **Warning**: This action is irreversible
- Confirmation required before deletion

---

## Badge System Details

### Badge Display Locations
Badges appear throughout the application:
- **Sidebar**: User list with badges next to names
- **Chat Header**: Selected user's badge visible
- **Profile Page**: User's own badge displayed
- **Sign Up**: Username system integrated

### Badge Design
- All badges are **SVG-based** with beautiful gradient colors
- Not emojis - high quality scalable graphics
- Sizes: xs, sm, md, lg, xl (responsive)
- Hover tooltips show badge name

### Badge Assignment Rules
1. **Admin badges** can only be assigned/removed by admins
2. **Premium badges** can be:
   - Assigned by admins to any user
   - Selected by premium users themselves (from profile)
3. Users can only have **one badge at a time**
4. Badge changes are instant and visible to all users

---

## Username System

### For Regular Users
- Username required during signup
- Can be changed from profile page
- **Limitation**: Once every 30 days
- Profile page shows countdown until next change is allowed
- Format: lowercase letters, numbers, underscores (3-20 chars)

### For Admin
- Can change any user's username at any time
- No cooldown restrictions
- Can override user's last change date
- Useful for handling policy violations or user requests

### Username Validation
- Real-time availability checking during signup
- Visual feedback (✓ available / ✗ taken)
- Database-level uniqueness enforcement
- Case-insensitive checking to prevent confusion

---

## Premium System

### Premium Benefits
- Special ✨ sparkle indicator
- Access to premium badge collection
- Can choose from 6 premium badges
- Enhanced profile customization

### Premium Management
- Admins can grant premium with flexible durations
- Expiration date tracked automatically
- System can auto-revoke expired premium (if implemented)
- Premium status visible in:
  - User list (sidebar)
  - Chat header
  - Profile page
  - Admin dashboard

---

## Technical Details

### Backend Endpoints
All admin endpoints are under `/api/admin`:
- `POST /api/admin/verify` - Verify admin password
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/badge` - Update user badge
- `PUT /api/admin/users/:id/premium` - Toggle premium status
- `PUT /api/admin/users/:id/password` - Reset password
- `PUT /api/admin/users/:id/username` - Change username
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `POST /api/admin/find-user` - Find user by username/email

### Database Schema Updates
User model includes:
- `username` - Unique, indexed, 3-20 chars
- `badgeType` - Enum with 11 badge types
- `isPremium` - Boolean flag
- `premiumExpiresAt` - Date field
- `lastUsernameChange` - Tracks cooldown
- `isBanned` - Boolean flag
- `banReason` - String field

### Frontend Components
- `Badge.jsx` - SVG badge rendering system
- `AdminPage.jsx` - Full admin dashboard
- `SignUpPage.jsx` - Updated with username field
- `ProfilePage.jsx` - Badge display and username editing
- `Sidebar.jsx` - Shows badges in user list
- `ChatHeader.jsx` - Shows badge for active chat

---

## Security Considerations

### Admin Authentication
- Password stored in environment variable
- Not exposed in frontend code
- Single hardcoded password for simplicity
- Consider implementing multi-admin system for production

### User Data Protection
- Deletion is irreversible - use with caution
- Password resets should be logged
- Ban reasons help with accountability
- Username changes tracked with timestamps

### Best Practices
1. Always provide ban reasons
2. Confirm deletions twice
3. Document premium grants in external system
4. Backup database before mass operations
5. Monitor admin actions for accountability

---

## Responsive Design

### Mobile Optimization
- Admin dashboard fully responsive
- Tables scroll horizontally on small screens
- Touch-friendly button sizes
- Modal dialogs adapt to screen size
- Stats cards stack vertically on mobile

### Desktop Experience
- Multi-column layout for efficiency
- Hover effects on interactive elements
- Dropdown menus for user actions
- Modal overlays for complex operations

---

## Troubleshooting

### Cannot Access Admin Page
- Verify password is `nafijpro++`
- Check `.env` file has `ADMIN_PASSWORD=nafijpro++`
- Restart backend server after .env changes

### Badges Not Showing
- Ensure Badge.jsx component exists
- Check import statements in components
- Verify user has badgeType field in database

### Username Changes Not Working
- Check 30-day cooldown hasn't expired for users
- Verify username meets format requirements
- Ensure username is unique (case-insensitive)

### Premium Status Not Saving
- Check premiumExpiresAt date is valid
- Verify isPremium boolean is set
- Ensure backend endpoint returns success

---

## Future Enhancements

Potential features to add:
- Activity logs for admin actions
- Multi-admin system with roles
- Bulk user operations
- Export user data to CSV
- Email notifications for password resets
- Automatic premium expiration handling
- Custom badge creation interface
- User reports and moderation queue
- Advanced analytics and charts

---

## Quick Reference

### Admin Checklist
✅ Access /admin with password `nafijpro++`
✅ Review dashboard statistics
✅ Search for specific users
✅ Assign badges (admin or premium)
✅ Grant premium status with duration
✅ Reset passwords when requested
✅ Change usernames for policy violations
✅ Ban users with clear reasons
✅ Delete accounts only when necessary

### Badge Types Summary
**Admin Badges:**
- admin, moderator, founder, developer, partner

**Premium Badges:**
- verified, premium, vip, star, diamond, crown

**Colors:**
- Admin: red-orange, purple-pink, gold, cyan-blue, emerald
- Premium: blue, gold, violet, pink, cyan, yellow

---

## Support

For issues or questions:
1. Check this documentation first
2. Review code comments in AdminPage.jsx
3. Check browser console for errors
4. Verify backend API responses
5. Test with different user accounts

**Remember**: With great power comes great responsibility. Use admin controls wisely and always prioritize user experience and data protection.
