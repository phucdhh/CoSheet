// Animal Names Generator for Anonymous Users
// Assigns consistent, fun animal names to users based on their ID

(function () {
    'use strict';

    // List of animals (similar to Google Docs)
    const ANIMALS = [
        'Axolotl', 'Bat', 'Python', 'Coyote', 'Liger', 'Koala', 'Blobfish',
        'Beaver', 'Leopard', 'Ifrit', 'Dragon', 'Phoenix', 'Unicorn', 'Griffin',
        'Kraken', 'Narwhal', 'Otter', 'Panda', 'Quokka', 'Raccoon', 'Sloth',
        'Tiger', 'Vulture', 'Walrus', 'Xenops', 'Yak', 'Zebra', 'Falcon',
        'Eagle', 'Hawk', 'Owl', 'Raven', 'Swan', 'Crane', 'Heron', 'Pelican',
        'Penguin', 'Dolphin', 'Whale', 'Shark', 'Octopus', 'Jellyfish', 'Starfish',
        'Turtle', 'Tortoise', 'Iguana', 'Gecko', 'Chameleon', 'Komodo'
    ];

    // Simple hash function to map user ID to animal index
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Get animal name for a user
    window.getAnimalName = function (userId) {
        const hash = hashString(userId.toString());
        const index = hash % ANIMALS.length;
        return ANIMALS[index];
    };

    // Get full anonymous name
    window.getAnonymousName = function (userId) {
        return 'Anonymous ' + getAnimalName(userId);
    };

    // Get first letter for avatar (animal's first letter)
    window.getAvatarLetter = function (userId) {
        return getAnimalName(userId).charAt(0);
    };

})();
