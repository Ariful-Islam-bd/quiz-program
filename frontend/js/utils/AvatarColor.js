// frontend/js/utils/AvatarColor.js
// Version: 1.0.0
// Description: নাম অনুযায়ী অ্যাভাটার কালার জেনারেট করার ইউটিলিটি

/**
 * নাম অনুযায়ী অ্যাভাটারের ব্যাকগ্রাউন্ড কালার জেনারেট করে
 * @param {string} name - ইউজারের নাম
 * @returns {string} CSS gradient বা solid color
 */
export function getAvatarColor(name) {
    const colors = [
        { bg: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
        { bg: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
        { bg: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
        { bg: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
        { bg: '#a18cd1', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
        { bg: '#fccb90', gradient: 'linear-gradient(135deg, #fccb90, #d57eeb)' },
        { bg: '#89f7fe', gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)' },
        { bg: '#f6d365', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
        { bg: '#d299c2', gradient: 'linear-gradient(135deg, #d299c2, #fef9d7)' },
        { bg: '#a8edea', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
        { bg: '#d4fc79', gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
        { bg: '#84fab0', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
        { bg: '#fbc2eb', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
        { bg: '#fddb92', gradient: 'linear-gradient(135deg, #fddb92, #d1fdff)' },
        { bg: '#c1f4c1', gradient: 'linear-gradient(135deg, #c1f4c1, #a8edea)' },
        { bg: '#ffecd2', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }
    ];
    
    if (!name || name.trim() === '') {
        return colors[0].gradient;
    }
    
    // নামের প্রথম অক্ষরের ASCII কোড ব্যবহার করে সূচক তৈরি
    const firstChar = name.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    const index = charCode % colors.length;
    
    return colors[index].gradient;
}

/**
 * নাম অনুযায়ী অ্যাভাটারের ব্যাকগ্রাউন্ড কালার (solid) রিটার্ন করে
 * @param {string} name - ইউজারের নাম
 * @returns {string} Hex color code
 */
export function getAvatarSolidColor(name) {
    const colors = [
        '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a18cd1',
        '#fccb90', '#89f7fe', '#f6d365', '#d299c2', '#a8edea',
        '#d4fc79', '#84fab0', '#fbc2eb', '#fddb92', '#c1f4c1'
    ];
    
    if (!name || name.trim() === '') {
        return colors[0];
    }
    
    const firstChar = name.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    const index = charCode % colors.length;
    
    return colors[index];
}