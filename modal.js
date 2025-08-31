// Modal system module - HTML modal functions
export { showProjectModal, showControlsModal };

// Project details modal
function showProjectModal(content, switchToFollowMode) {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'project-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Arial', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a1a1a;
        border-radius: 12px;
        padding: 30px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #444;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        position: relative;
        color: #fff;
    `;

    // Content with close button at the bottom
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        <h1 style="color: #fff; margin-bottom: 20px; font-size: 1.8em; text-align: center;">${content.title}</h1>
        <div style="margin-bottom: 15px;">
            <h3 style="color: #888; margin-bottom: 5px; font-size: 1em;">PROBLEM</h3>
            <p style="margin: 0; color: #ccc;">${content.problem}</p>
        </div>
        <div style="margin-bottom: 15px;">
            <h3 style="color: #888; margin-bottom: 5px; font-size: 1em;">TIMELINE</h3>
            <p style="margin: 0; color: #fff; font-weight: bold;">${content.timeline}</p>
        </div>
        <div style="margin-bottom: 15px;">
            <h3 style="color: #888; margin-bottom: 5px; font-size: 1em;">SOLUTION</h3>
            <p style="margin: 0; color: #ccc;">${content.solution}</p>
        </div>
        <div style="margin-bottom: 25px;">
            <h3 style="color: #888; margin-bottom: 5px; font-size: 1em;">TECHNOLOGIES</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${content.tags.map(tag => `<span style="background: #333; color: #888; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">${tag}</span>`).join('')}
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button id="close-modal-btn" style="
                background: #555;
                color: #fff;
                border: none;
                padding: 15px 40px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: background 0.2s;
                min-width: 120px;
                min-height: 50px;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            ">Close</button>
        </div>
    `;

    // Get the close button from the content and add click handler
    const closeBtn = contentDiv.querySelector('#close-modal-btn');

    // Function to close modal
    const closeModal = () => {
        console.log('Modal closed');
        modal.remove();
        if (switchToFollowMode) switchToFollowMode();
    };

    // Add both click and touch events for mobile compatibility
    closeBtn.onclick = closeModal;

    // Add touch events for mobile
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        console.log('Touch start on close button');
    }, { passive: false });

    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        console.log('Touch end on close button');
        closeModal();
    }, { passive: false });

    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on outside click (only if clicking the modal backdrop, not the content)
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
            if (switchToFollowMode) switchToFollowMode();
        }
    };

    // Close on escape
    const escapeHandler = (e) => {
        if (e.code === 'Escape') {
            modal.remove();
            if (switchToFollowMode) switchToFollowMode();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Controls guide modal
function showControlsModal() {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'controls-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Arial', sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a1a1a;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #444;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        position: relative;
        color: #fff;
    `;

    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Content with controls
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        <h1 style="color: #fff; margin-bottom: 25px; font-size: 1.8em; text-align: center;">🎮 Controls Guide</h1>

        <div style="display: ${isMobile ? 'none' : 'block'};">
            <h2 style="color: #888; margin-bottom: 15px; font-size: 1.2em;">🖥️ Desktop Controls</h2>
            <div style="margin-bottom: 20px; line-height: 1.6;">
                <div style="margin-bottom: 10px;"><strong>WASD or Arrow Keys:</strong> Sail the boat</div>
                <div style="margin-bottom: 10px;"><strong>Shift:</strong> Speed boost while sailing</div>
                <div style="margin-bottom: 10px;"><strong>E:</strong> View project details (near buoys)</div>
                <div style="margin-bottom: 10px;"><strong>C:</strong> Toggle camera mode (follow/orbit)</div>
                <div style="margin-bottom: 10px;"><strong>Mouse:</strong> Orbit camera (in orbit mode)</div>
                <div style="margin-bottom: 10px;"><strong>Scroll:</strong> Zoom in/out (in orbit mode)</div>
            </div>
        </div>

        <div style="display: ${isMobile ? 'block' : 'none'};">
            <h2 style="color: #888; margin-bottom: 15px; font-size: 1.2em;">📱 Mobile Controls</h2>
            <div style="margin-bottom: 20px; line-height: 1.6;">
                <div style="margin-bottom: 10px;"><strong>D-Pad:</strong> Sail the boat</div>
                <div style="margin-bottom: 10px;"><strong>Speed Boost Button:</strong> Faster sailing</div>
                <div style="margin-bottom: 10px;"><strong>E Button:</strong> View project details (near buoys)</div>
                <div style="margin-bottom: 10px;"><strong>C Button:</strong> Toggle camera mode</div>
                <div style="margin-bottom: 10px;"><strong>Touch & Drag:</strong> Orbit camera (in orbit mode)</div>
                <div style="margin-bottom: 10px;"><strong>Pinch:</strong> Zoom in/out (in orbit mode)</div>
            </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h3 style="color: #fff; margin-bottom: 10px;">💡 Tips</h3>
            <div style="line-height: 1.6;">
                <div>• Look for glowing buoys to find projects</div>
                <div>• Light gray: New project • Medium gray: Ready • Dark gray: Visited</div>
                <div>• Sail close to buoys and press E to view details</div>
                <div>• Use C to switch between following the boat or orbiting</div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <button id="close-controls-btn" style="
                background: #555;
                color: #fff;
                border: none;
                padding: 12px 35px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: background 0.2s;
                min-width: 100px;
                -webkit-tap-highlight-color: transparent;
            ">Got it!</button>
        </div>
    `;

    // Get close button and add handler
    const closeBtn = contentDiv.querySelector('#close-controls-btn');
    const closeModal = () => {
        modal.remove();
    };

    closeBtn.onclick = closeModal;

    // Add touch events for mobile
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });

    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeModal();
    }, { passive: false });

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };

    // Close on escape
    const escapeHandler = (e) => {
        if (e.code === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}