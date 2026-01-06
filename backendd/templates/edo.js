// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Section switching functionality
    window.showSection = function(sectionId, event) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'flex';
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        // Update URL hash
        if (sectionId !== 'home') {
            window.location.hash = sectionId;
        } else {
            history.replaceState(null, null, ' ');
        }
    };

    // Enhanced parallax effect for glow arcs
    function updateParallax(e) {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.015;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.015;

        const topArc = document.querySelector('.glow-arc.top');
        const bottomArc = document.querySelector('.glow-arc.bottom');

        if (topArc && bottomArc) {
            topArc.style.transform = `translate(${moveX}px, ${moveY}px)`;
            bottomArc.style.transform = `translate(${-moveX * 1.2}px, ${-moveY * 1.2}px)`;
        }
    }

    // Add parallax effect
    document.addEventListener('mousemove', updateParallax);

    // Handle navigation clicks
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (sectionId) {
                showSection(sectionId, e);
            }
        });
    });

    // Handle hash navigation on page load
    function handleHashNavigation() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            showSection(hash);
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);
    
    // Check for hash on page load
    handleHashNavigation();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animations
    document.querySelectorAll('.feature-card, .stat-card, .glass-btn, .cta-glass-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add button hover effects
    document.querySelectorAll('.btn-primary, .btn-solid, .btn-outline').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add card hover effects
    document.querySelectorAll('.feature-card, .stat-card, .glass-btn').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Initialize default section
    if (!window.location.hash) {
        showSection('home');
    }

    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    console.log('Flowra website initialized successfully!');
}

// API functions for future backend integration
const FlowraAPI = {
    // Sensor registration
    async registerSensor(sensorData) {
        try {
            const response = await fetch('/api/register_sensor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sensorData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error registering sensor:', error);
            return { error: 'Failed to register sensor' };
        }
    },

    // Send sensor data
    async sendSensorData(data) {
        try {
            const response = await fetch('/api/sensor_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending sensor data:', error);
            return { error: 'Failed to send sensor data' };
        }
    }
};

// Make API available globally
window.FlowraAPI = FlowraAPI;
