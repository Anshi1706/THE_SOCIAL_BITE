// performance.js - Performance optimizations and utilities
class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleFlags = new Map();
        this.cache = new Map();
        this.observedElements = new Set();
        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
    }

    // Debounce function for search and resize events
    debounce(func, wait, immediate = false) {
        return (...args) => {
            const later = () => {
                this.debounceTimers.delete(func);
                if (!immediate) func.apply(this, args);
            };

            const callNow = immediate && !this.debounceTimers.has(func);
            
            // Clear existing timer
            const existingTimer = this.debounceTimers.get(func);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            // Set new timer
            const timer = setTimeout(later, wait);
            this.debounceTimers.set(func, timer);

            if (callNow) func.apply(this, args);
        };
    }

    // Throttle function for scroll and mouse events
    throttle(func, limit) {
        return (...args) => {
            if (!this.throttleFlags.has(func)) {
                func.apply(this, args);
                this.throttleFlags.set(func, true);
                
                setTimeout(() => {
                    this.throttleFlags.delete(func);
                }, limit);
            }
        };
    }

    // Lazy load images with error handling and fallbacks
    lazyLoadImages(selector = 'img[data-src]') {
        if (!('IntersectionObserver' in window)) {
            this.loadAllImagesImmediately(selector);
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img);
                    this.observedElements.delete(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Start loading 50px before element enters viewport
            threshold: 0.1
        });

        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            this.observedElements.add(img);
            imageObserver.observe(img);
        });

        // Fallback: load all images after 3 seconds if IntersectionObserver fails
        setTimeout(() => {
            this.observedElements.forEach(img => {
                this.loadImage(img);
                imageObserver.unobserve(img);
            });
            this.observedElements.clear();
        }, 3000);
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('lazy-loaded');
        };
        tempImg.onerror = () => {
            console.warn('Failed to load image:', src);
            img.classList.add('lazy-load-failed');
            // Set a placeholder image or hide the element
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
        };
        tempImg.src = src;
    }

    loadAllImagesImmediately(selector) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        });
    }

    // Preload critical resources
    preloadCriticalResources() {
        const resources = [
            { href: '/css/critical.css', as: 'style' },
            { href: '/js/auth.js', as: 'script' },
            { href: '/js/cart.js', as: 'script' },
            { href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', as: 'style' },
            { href: 'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap', as: 'font', crossOrigin: 'anonymous' }
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            
            if (resource.crossOrigin) {
                link.crossOrigin = resource.crossOrigin;
            }
            
            // Add additional attributes for font preloading
            if (resource.as === 'font') {
                link.type = 'font/woff2';
            }
            
            link.onload = () => console.log(`Preloaded: ${resource.href}`);
            link.onerror = () => console.error(`Failed to preload: ${resource.href}`);
            
            document.head.appendChild(link);
        });
    }

    // Preconnect to important origins
    preconnectOrigins() {
        const origins = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com',
            'https://images.unsplash.com'
        ];

        origins.forEach(origin => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = origin;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // Cache DOM elements with automatic cleanup
    cacheDOM(selectors = {}) {
        const defaultSelectors = {
            cartBadge: '#cartCount, #cartBadge',
            searchInput: '#searchInput',
            restaurantsContainer: '#restaurants-container',
            ordersList: '#ordersList',
            mainNavigation: '#mainNavigation'
        };

        const allSelectors = { ...defaultSelectors, ...selectors };
        
        Object.keys(allSelectors).forEach(key => {
            try {
                const element = document.querySelector(allSelectors[key]);
                if (element) {
                    this.cache.set(key, element);
                }
            } catch (error) {
                console.warn(`Failed to cache element for ${key}:`, error);
            }
        });

        // Set up periodic cache cleanup
        this.setupCacheCleanup();
    }

    setupCacheCleanup() {
        // Clean cache every 5 minutes
        setInterval(() => {
            this.cleanCache();
        }, 5 * 60 * 1000);
    }

    cleanCache() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes
        
        for (let [key, value] of this.cache) {
            if (value.timestamp && (now - value.timestamp > maxAge)) {
                this.cache.delete(key);
            }
        }
    }

    getCachedElement(key) {
        return this.cache.get(key);
    }

    // Optimized localStorage operations with compression and batch operations
    optimizedLocalStorage = {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return defaultValue;
                
                // Try to decompress if it's compressed data
                if (item.startsWith('compressed::')) {
                    const compressed = item.replace('compressed::', '');
                    const decompressed = this.decompress(compressed);
                    return JSON.parse(decompressed);
                }
                
                return JSON.parse(item);
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },
        
        set: (key, value, compress = false) => {
            try {
                let dataToStore;
                
                if (compress && this.needsCompression(value)) {
                    const compressed = this.compress(JSON.stringify(value));
                    dataToStore = 'compressed::' + compressed;
                } else {
                    dataToStore = JSON.stringify(value);
                }
                
                localStorage.setItem(key, dataToStore);
                return true;
            } catch (e) {
                console.error('Error writing to localStorage:', e);
                
                // Handle storage quota exceeded
                if (e.name === 'QuotaExceededError') {
                    return this.handleStorageFull(key, value, compress);
                }
                
                return false;
            }
        },

        // Batch operations for multiple items
        setMultiple: (items, compress = false) => {
            const results = {};
            for (const [key, value] of Object.entries(items)) {
                results[key] = this.set(key, value, compress);
            }
            return results;
        },

        getMultiple: (keys) => {
            const results = {};
            keys.forEach(key => {
                results[key] = this.get(key);
            });
            return results;
        },

        // Compression utilities
        compress: (str) => {
            // Simple compression for large strings
            if (str.length < 1000) return str; // Don't compress small strings
            
            try {
                // Use simple encoding for demo - in production, consider LZ-String
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
                    (match, p1) => String.fromCharCode('0x' + p1)));
            } catch (e) {
                console.warn('Compression failed, storing uncompressed:', e);
                return str;
            }
        },

        decompress: (str) => {
            try {
                return decodeURIComponent(Array.from(atob(str)).map(
                    char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)
                ).join(''));
            } catch (e) {
                console.warn('Decompression failed, returning original:', e);
                return str;
            }
        },

        needsCompression: (value) => {
            const str = JSON.stringify(value);
            return str.length > 1000; // Compress strings longer than 1KB
        },

        handleStorageFull: (key, value, compress) => {
            console.warn('Storage full, attempting cleanup...');
            
            // Clear old cache data first
            this.clearOldData();
            
            try {
                // Try again after cleanup
                let dataToStore;
                if (compress) {
                    const compressed = this.compress(JSON.stringify(value));
                    dataToStore = 'compressed::' + compressed;
                } else {
                    dataToStore = JSON.stringify(value);
                }
                
                localStorage.setItem(key, dataToStore);
                return true;
            } catch (e2) {
                console.error('Still unable to save after cleanup:', e2);
                
                // Last resort: remove least important data
                this.clearNonEssentialData();
                
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e3) {
                    console.error('Failed to save after all cleanup attempts:', e3);
                    return false;
                }
            }
        },

        clearOldData: () => {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('log_'))) {
                    try {
                        const item = localStorage.getItem(key);
                        const parsed = JSON.parse(item);
                        if (parsed && parsed.timestamp && parsed.timestamp < oneWeekAgo) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('Removed old data:', key);
            });
        },

        clearNonEssentialData: () => {
            const essentialKeys = ['currentUser', 'cart', 'orders', 'orderHistory'];
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !essentialKeys.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove non-essential keys, keeping most recent
            keysToRemove.sort().slice(0, Math.floor(keysToRemove.length / 2))
                       .forEach(key => localStorage.removeItem(key));
        }
    };

    // Performance monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor long tasks
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) { // Tasks longer than 50ms
                                console.warn('Long task detected:', entry);
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    console.warn('Long task monitoring not supported:', e);
                }
            }

            // Monitor largest contentful paint
            if ('PerformanceObserver' in window) {
                try {
                    const lcpObserver = new PerformanceObserver((entryList) => {
                        const entries = entryList.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        console.log('LCP:', lastEntry.startTime);
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    console.warn('LCP monitoring not supported:', e);
                }
            }
        }
    }

    // Error tracking
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.logError('Global error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection', {
                reason: event.reason?.message || event.reason
            });
        });
    }

    logError(type, data) {
        const errorLog = this.optimizedLocalStorage.get('errorLog', []);
        errorLog.unshift({
            type,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });

        // Keep only last 50 errors
        if (errorLog.length > 50) {
            errorLog.length = 50;
        }

        this.optimizedLocalStorage.set('errorLog', errorLog);
    }

    // Memory management
    cleanup() {
        // Clear all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        
        // Clear throttle flags
        this.throttleFlags.clear();
        
        // Clear observed elements
        this.observedElements.clear();
        
        // Clear cache (optional, keep if you want persistent cache)
        // this.cache.clear();
    }

    // Utility to measure function performance
    measurePerformance(fn, name = 'Function') {
        return (...args) => {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();
            
            console.log(`${name} executed in: ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }

    // Prefetch resources for likely next pages
    prefetchResources() {
        if ('IntersectionObserver' in window) {
            const linkObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const link = entry.target;
                        const href = link.getAttribute('href');
                        
                        if (href && this.shouldPrefetch(href)) {
                            this.prefetchPage(href);
                            linkObserver.unobserve(link);
                        }
                    }
                });
            });

            // Observe all internal links
            document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]')
                    .forEach(link => linkObserver.observe(link));
        }
    }

    shouldPrefetch(url) {
        // Don't prefetch if already on the page or if it's a different section
        return !url.includes('#') && 
               url !== window.location.href &&
               !url.includes('logout') &&
               !url.includes('delete');
    }

    prefetchPage(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document';
        document.head.appendChild(link);
    }
}

// Initialize performance optimizer
const perfOptimizer = new PerformanceOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

// Usage examples:
// const debouncedSearch = perfOptimizer.debounce(searchFunction, 300);
// const throttledScroll = perfOptimizer.throttle(scrollFunction, 100);
// perfOptimizer.lazyLoadImages();
// perfOptimizer.preloadCriticalResources();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    perfOptimizer.cacheDOM();
    perfOptimizer.lazyLoadImages();
    perfOptimizer.preloadCriticalResources();
    perfOptimizer.preconnectOrigins();
    
    // Prefetch resources when browser is idle
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            perfOptimizer.prefetchResources();
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    perfOptimizer.cleanup();
});