// User Avatars UI Component - Google Sheets Style
// Displays active users with colored avatars, stacking, and dropdown

(function () {
    'use strict';

    const MAX_VISIBLE_AVATARS = 4; // Show max 4, rest in overflow
    const IDLE_TIMEOUT = 60000; // 1 minute of inactivity = idle

    let users = {}; // userId -> {color, animal, name, lastActive, isYou}
    let dropdownVisible = false;

    // Initialize the component
    function init() {
        // Create container
        const container = document.createElement('div');
        container.id = 'user-avatars-container';
        container.className = 'user-avatars-container';

        // Add to page (after body loads)
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(container);
            });
        }

        // Listen for user updates from SocialCalc
        if (window.SocialCalc) {
            // Hook into existing user tracking
            const originalGetUserColor = SocialCalc.getUserColor;
            SocialCalc.getUserColor = function (username) {
                const color = originalGetUserColor(username);
                addOrUpdateUser(username, color);
                return color;
            };
        }

        // Update idle status periodically
        setInterval(updateIdleStatus, 10000); // Check every 10 seconds

        // Close dropdown and tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-avatars-container')) {
                hideDropdown();
                hideTooltip();
            }
        });

        render();
    }

    // Add or update a user
    function addOrUpdateUser(userId, color) {
        const isNew = !users[userId];
        const isYou = userId === (window.SocialCalc && SocialCalc._username);

        users[userId] = {
            userId: userId,
            color: color,
            animal: window.getAnimalName ? window.getAnimalName(userId) : 'User',
            name: window.getAnonymousName ? window.getAnonymousName(userId) : userId,
            letter: window.getAvatarLetter ? window.getAvatarLetter(userId) : '?',
            lastActive: Date.now(),
            isYou: isYou,
            isIdle: false,
            joining: isNew
        };

        render();

        // Remove joining animation after it plays
        if (isNew) {
            setTimeout(() => {
                if (users[userId]) {
                    users[userId].joining = false;
                    render();
                }
            }, 300);
        }
    }

    // Remove a user
    function removeUser(userId) {
        delete users[userId];
        render();
    }

    // Update activity for a user
    function updateUserActivity(userId) {
        if (users[userId]) {
            users[userId].lastActive = Date.now();
            users[userId].isIdle = false;
            render();
        }
    }

    // Update idle status for all users
    function updateIdleStatus() {
        const now = Date.now();
        let changed = false;

        for (const userId in users) {
            const user = users[userId];
            const wasIdle = user.isIdle;
            user.isIdle = (now - user.lastActive) > IDLE_TIMEOUT;

            if (wasIdle !== user.isIdle) {
                changed = true;
            }
        }

        if (changed) {
            render();
        }
    }

    // Render avatars
    function render() {
        const container = document.getElementById('user-avatars-container');
        if (!container) return;

        const userList = Object.values(users);
        const totalUsers = userList.length;

        // Clear container
        container.innerHTML = '';

        if (totalUsers === 0) {
            return; // No users, no display
        }

        // Create stack container
        const stack = document.createElement('div');
        stack.className = 'user-avatars-stack';

        // Show first MAX_VISIBLE_AVATARS
        const visibleUsers = userList.slice(0, MAX_VISIBLE_AVATARS);
        const overflowCount = Math.max(0, totalUsers - MAX_VISIBLE_AVATARS);

        // Render visible avatars (in reverse for stacking)
        visibleUsers.reverse().forEach(user => {
            const avatar = createAvatar(user);
            stack.appendChild(avatar);
        });

        container.appendChild(stack);

        // Add overflow badge if needed - SEPARATE from stack
        if (overflowCount > 0) {
            const badge = document.createElement('div');
            badge.className = 'user-count-badge';
            badge.textContent = '+' + overflowCount;
            badge.onclick = toggleDropdown; // Badge shows full dropdown
            container.appendChild(badge); // Added directly to container, not stack
        }

        // Add dropdown
        const dropdown = createDropdown(userList);
        container.appendChild(dropdown);

        // Add tooltip if visible
        if (tooltipVisible && tooltipUser) {
            const tooltip = createTooltip(tooltipUser);
            if (tooltip) {
                container.appendChild(tooltip);
            }
        }
    }

    // Create a single avatar element
    function createAvatar(user) {
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar' + (user.joining ? ' joining' : '');
        avatar.style.backgroundColor = user.color;
        avatar.textContent = user.letter;
        avatar.title = user.name;
        // Click shows individual user tooltip
        avatar.onclick = (e) => showUserTooltip(user, e);
        return avatar;
    }

    // Create dropdown
    function createDropdown(userList) {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown' + (dropdownVisible ? ' visible' : '');
        dropdown.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking inside

        // Header
        const header = document.createElement('div');
        header.className = 'user-dropdown-header';
        header.textContent = userList.length + ' total viewer' + (userList.length !== 1 ? 's' : '');
        dropdown.appendChild(header);

        // List
        const list = document.createElement('div');
        list.className = 'user-dropdown-list';

        // Sort: You first, then active, then idle
        userList.sort((a, b) => {
            if (a.isYou) return -1;
            if (b.isYou) return 1;
            if (a.isIdle !== b.isIdle) return a.isIdle ? 1 : -1;
            return a.name.localeCompare(b.name);
        });

        userList.forEach(user => {
            const item = createDropdownItem(user);
            list.appendChild(item);
        });

        dropdown.appendChild(list);
        return dropdown;
    }

    // Create dropdown item
    function createDropdownItem(user) {
        const item = document.createElement('div');
        item.className = 'user-dropdown-item';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'user-dropdown-avatar';
        avatar.style.backgroundColor = user.color;
        avatar.textContent = user.letter;
        item.appendChild(avatar);

        // Info
        const info = document.createElement('div');
        info.className = 'user-dropdown-info';

        const name = document.createElement('div');
        name.className = 'user-dropdown-name' + (user.isYou ? ' you' : '');
        name.textContent = user.name;
        info.appendChild(name);

        if (user.isIdle && !user.isYou) {
            const status = document.createElement('div');
            status.className = 'user-dropdown-status idle';
            status.textContent = 'Idle';
            info.appendChild(status);
        }

        item.appendChild(info);
        return item;
    }

    // Toggle dropdown visibility
    function toggleDropdown(e) {
        e.stopPropagation();
        dropdownVisible = !dropdownVisible;
        tooltipVisible = false; // Hide tooltip when showing dropdown
        render();
    }

    // Hide dropdown
    function hideDropdown() {
        if (dropdownVisible) {
            dropdownVisible = false;
            render();
        }
    }

    let tooltipVisible = false;
    let tooltipUser = null;

    // Show tooltip for individual user
    function showUserTooltip(user, e) {
        e.stopPropagation();
        tooltipUser = user;
        tooltipVisible = true;
        dropdownVisible = false; // Hide dropdown when showing tooltip
        render();
    }

    // Hide tooltip
    function hideTooltip() {
        if (tooltipVisible) {
            tooltipVisible = false;
            tooltipUser = null;
            render();
        }
    }

    // Create user tooltip
    function createTooltip(user) {
        if (!user) return null;

        const tooltip = document.createElement('div');
        tooltip.className = 'user-tooltip' + (tooltipVisible ? ' visible' : '');
        tooltip.onclick = (e) => e.stopPropagation();

        const content = document.createElement('div');
        content.className = 'user-tooltip-content';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'user-tooltip-avatar';
        avatar.style.backgroundColor = user.color;
        avatar.textContent = user.letter;
        content.appendChild(avatar);

        // Info
        const info = document.createElement('div');
        info.className = 'user-tooltip-info';

        const name = document.createElement('div');
        name.className = 'user-tooltip-name';
        name.textContent = user.name + (user.isYou ? ' (you)' : '');
        info.appendChild(name);

        if (user.isIdle && !user.isYou) {
            const status = document.createElement('div');
            status.className = 'user-tooltip-status';
            status.textContent = 'Idle';
            info.appendChild(status);
        }

        content.appendChild(info);
        tooltip.appendChild(content);

        return tooltip;
    }

    // Public API
    window.UserAvatars = {
        init: init,
        addUser: addOrUpdateUser,
        removeUser: removeUser,
        updateActivity: updateUserActivity
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
