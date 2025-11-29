# User Deletion Authorization Fix

## Issue
Organization Owners were unable to delete users and received a 403 Forbidden error, even though they should have permission to manage users within their organization.

## Root Cause
The original implementation only allowed superusers to delete users:
```python
if not current_user.is_superuser:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to delete users"
    )
```

## Solution
Updated the authorization logic to check organization membership and roles:

### Changes Made

#### 1. Updated `delete_user` endpoint
Now checks:
- ✅ Superusers can delete any user
- ✅ Organization owners can delete users in their org
- ✅ Organization admins can delete users in their org
- ✅ Still prevents deleting yourself

#### 2. Updated `update_user` endpoint
Now checks:
- ✅ Users can update themselves
- ✅ Superusers can update any user
- ✅ Organization owners can update users in their org
- ✅ Organization admins can update users in their org

#### 3. Updated `is_active` status change
Now allows:
- ✅ Superusers to change any user's status
- ✅ Organization owners to change user status in their org
- ✅ Organization admins to change user status in their org

## Authorization Logic

The authorization check works as follows:

1. **Get current user's organizations** where they are owner or admin:
   - Check `UserOrganisation` table for `role IN ('owner', 'admin')`
   - Check `Organisation` table for `owner_id = current_user.id`

2. **Get target user's organizations**:
   - Get all organizations the target user belongs to from `UserOrganisation` table

3. **Check intersection**:
   - If there's any overlap between these two sets, authorization is granted
   - This means the current user manages at least one organization that the target user belongs to

## Database Models Used

### Organisation
```python
class Organisation(Base):
    id = Column(UUID)
    name = Column(String)
    owner_id = Column(UUID, ForeignKey("users.id"))  # Primary owner
```

### UserOrganisation
```python
class UserOrganisation(Base):
    user_id = Column(UUID, ForeignKey("users.id"), primary_key=True)
    organisation_id = Column(UUID, ForeignKey("organisations.id"), primary_key=True)
    role = Column(String)  # 'owner', 'admin', 'member', etc.
```

## Code Example

```python
# Get organizations where current user is owner or admin
current_user_orgs = await db.execute(
    select(UserOrganisation).where(
        UserOrganisation.user_id == current_user.id,
        UserOrganisation.role.in_(['owner', 'admin'])
    )
)
current_user_org_ids = {uo.organisation_id for uo in current_user_orgs.scalars().all()}

# Also check if current user owns any organizations
owned_orgs = await db.execute(
    select(Organisation).where(Organisation.owner_id == current_user.id)
)
current_user_org_ids.update({org.id for org in owned_orgs.scalars().all()})

# Get organizations that the target user belongs to
target_user_orgs = await db.execute(
    select(UserOrganisation).where(UserOrganisation.user_id == user_id)
)
target_user_org_ids = {uo.organisation_id for uo in target_user_orgs.scalars().all()}

# Check if there's any overlap
if not current_user_org_ids.intersection(target_user_org_ids):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to delete this user"
    )
```

## Testing

### Test Cases
1. ✅ Organization owner can delete users in their organization
2. ✅ Organization admin can delete users in their organization
3. ✅ Users cannot delete themselves
4. ✅ Users cannot delete users from other organizations
5. ✅ Superusers can delete any user

### Test Script
```python
# As organization owner
DELETE /api/v1/users/{user_id}
# Should succeed if user is in owner's organization

# As organization admin
DELETE /api/v1/users/{user_id}
# Should succeed if user is in admin's organization

# As regular member
DELETE /api/v1/users/{user_id}
# Should fail with 403

# Try to delete yourself
DELETE /api/v1/users/{current_user_id}
# Should fail with 400
```

## Files Modified
- ✅ `backend/app/api/v1/users.py`
  - Updated `delete_user()` function
  - Updated `update_user()` function
  - Updated `is_active` status change logic

## Benefits
1. **Better UX**: Organization owners/admins can now manage their users without needing superuser access
2. **Security**: Still maintains proper authorization checks
3. **Scalability**: Works for users who belong to multiple organizations
4. **Safety**: Prevents users from deleting themselves

## Error Messages
- **403 Forbidden**: "Not authorized to delete this user. You must be an owner or admin of an organization this user belongs to."
- **400 Bad Request**: "Cannot delete yourself"
- **404 Not Found**: "User not found"
