// Modal system module - HTML modal functions
export { showProjectModal, showControlsModal };

// Project details modal
function showProjectModal(content, switchToFollowMode) {
    // Check if this is the special project for enhanced presentation
    const isSpecialProject = content.title.includes('Multi-Agent Financial Companion');

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'project-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Arial', sans-serif;
        overflow-y: auto;
    `;

    // Create modal content - much larger for the special project
    const modalContent = document.createElement('div');
    const modalWidth = isSpecialProject ? '95%' : '90%';
    const maxWidth = isSpecialProject ? '1200px' : '700px';

    modalContent.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        border-radius: 16px;
        padding: ${isSpecialProject ? '40px' : '30px'};
        max-width: ${maxWidth};
        width: ${modalWidth};
        max-height: 90vh;
        overflow-y: auto;
        border: 3px solid #4CAF50;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
        position: relative;
        color: #fff;
        margin: 20px;
    `;

    // Declare contentDiv at function scope
    let contentDiv;

    // Enhanced content for the special project
    if (isSpecialProject) {
        contentDiv = document.createElement('div');
        contentDiv.innerHTML = `

            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4CAF50; margin-bottom: 10px; font-size: 2.5em; font-weight: bold;">${content.title}</h1>
                <div style="width: 100px; height: 4px; background: #4CAF50; margin: 0 auto; border-radius: 2px;"></div>
            </div>

            <!-- Problem Section -->
            <div style="margin-bottom: 40px; padding: 25px; background: rgba(255, 0, 0, 0.1); border-radius: 12px; border-left: 4px solid #ff4444;">
                <h2 style="color: #ff6b6b; margin-bottom: 15px; font-size: 1.4em;">💔 The Problem</h2>
                <p style="margin: 0; color: #ccc; font-size: 1.1em; line-height: 1.6;">${content.problem}</p>
            </div>

            <!-- Solution Section -->
            <div style="margin-bottom: 40px; padding: 25px; background: rgba(76, 175, 80, 0.1); border-radius: 12px; border-left: 4px solid #4CAF50;">
                <h2 style="color: #4CAF50; margin-bottom: 15px; font-size: 1.4em;">✨ The Solution</h2>
                <p style="margin: 0; color: #ccc; font-size: 1.1em; line-height: 1.6;">${content.solution}</p>
            </div>

            <!-- Interactive Mermaid Architecture Diagram -->
            <div style="margin-bottom: 40px; padding: 30px; background: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                <h2 style="color: #4CAF50; margin-bottom: 20px; font-size: 1.4em; text-align: center;">🏗️ System Architecture</h2>

                <div id="mermaid-diagram" style="display: flex; justify-content: center; margin-bottom: 30px;">
                    <div class="mermaid" style="width: 100%; max-width: 900px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; border: 1px solid #444; min-height: 400px;">
                        graph TD
                            %% Define node styles
                            USER[👤 YOU<br/>User]
                            Agents[🎯 Agent<br/>Supervisor]
                            FINANCE[💰 FINANCE<br/>Plaid Data<br/>Real Money]
                            WEALTH[🎓 WEALTH<br/>Coaching<br/>Personality]
                            GOALS[📊 GOALS<br/>Budget<br/>Planning]
                            MEMORY[🧠 MEMORY<br/>Episodic + Semantic]

                            %% Style classes
                            classDef userStyle fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:white
                            classDef supervisorStyle fill:#2196F3,stroke:#1976D2,stroke-width:3px,color:white
                            classDef agentStyle fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:white
                            classDef memoryStyle fill:#FFC107,stroke:#FF8F00,stroke-width:2px,color:black

                            %% Apply styles
                            USER:::userStyle
                            AGENT:::supervisorStyle
                            FINANCE:::agentStyle
                            WEALTH:::agentStyle
                            GOALS:::agentStyle
                            MEMORY:::memoryStyle

                            %% Connections
                            USER --> AGENT
                            AGENT --> FINANCE
                            AGENT --> WEALTH
                            AGENT --> GOALS
                            AGENT --> MEMORY

                            %% Group agents
                            subgraph AGENTS["🤖 Specialized Agents"]
                                FINANCE
                                WEALTH
                                GOALS
                            end
                    </div>
                </div>

                <!-- Diagram Legend -->
                <div style="text-align: center; margin-top: 15px; font-size: 0.9em; color: #ccc;">
                    <strong>💡 Click on any node to see details!</strong>
                </div>

                <!-- Agent Descriptions -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="padding: 15px; background: rgba(255, 152, 0, 0.1); border-radius: 8px; border-left: 3px solid #FF9800;">
                        <h4 style="color: #FF9800; margin-bottom: 8px;">💰 Finance Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Connects to your real financial data via Plaid. Analyzes spending patterns and provides insights without judgment.</p>
                    </div>
                    <div style="padding: 15px; background: rgba(156, 39, 176, 0.1); border-radius: 8px; border-left: 3px solid #9C27B0;">
                        <h4 style="color: #9C27B0; margin-bottom: 8px;">🎯 Wealth Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Your personal financial coach. Adapts communication style based on your personality and anxiety levels.</p>
                    </div>
                    <div style="padding: 15px; background: rgba(255, 87, 34, 0.1); border-radius: 8px; border-left: 3px solid #FF5722;">
                        <h4 style="color: #FF5722; margin-bottom: 8px;">📊 Goal Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Helps you build budgets that actually work for your life. Remembers your preferences and adjusts goals accordingly.</p>
                    </div>
                </div>
            </div>

            <!-- Timeline and Technologies -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <h3 style="color: #FFC107; margin-bottom: 10px;">⏱️ Timeline</h3>
                    <p style="margin: 0; color: #fff; font-size: 1.1em; font-weight: bold;">${content.timeline}</p>
                </div>
                <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                    <h3 style="color: #FFC107; margin-bottom: 10px;">🛠️ Technologies</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${content.tags.map(tag => `<span style="background: #333; color: #ccc; padding: 6px 12px; border-radius: 15px; font-size: 0.85em; border: 1px solid #555;">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Key Features -->
            <div style="margin-bottom: 40px; padding: 25px; background: rgba(76, 175, 80, 0.1); border-radius: 12px;">
                <h2 style="color: #4CAF50; margin-bottom: 20px; font-size: 1.4em;">🌟 Key Features</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">🧠</span>
                        <div>
                            <strong style="color: #fff;">Memory System</strong><br/>
                            <small style="color: #ccc;">Remembers your personality & preferences</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">💬</span>
                        <div>
                            <strong style="color: #fff;">Emotional Intelligence</strong><br/>
                            <small style="color: #ccc;">Adapts to your anxiety levels</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">🔒</span>
                        <div>
                            <strong style="color: #fff;">Safe Space</strong><br/>
                            <small style="color: #ccc;">Non-judgmental financial guidance</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">🎯</span>
                        <div>
                            <strong style="color: #fff;">Personal Goals</strong><br/>
                            <small style="color: #ccc;">Budgets that work for your life</small>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button id="close-modal-btn" style="
                    background: linear-gradient(135deg, #4CAF50, #2E7D32);
                    color: #fff;
                    border: none;
                    padding: 18px 50px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 20px;
                    font-weight: bold;
                    transition: all 0.3s;
                    min-width: 150px;
                    min-height: 60px;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(76, 175, 80, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(76, 175, 80, 0.3)';">Close</button>
            </div>

        `;

        modalContent.appendChild(contentDiv);

        // Initialize Mermaid.js (now loaded in HTML head)
        const initializeMermaid = () => {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                themeVariables: {
                    primaryColor: '#4CAF50',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#2E7D32',
                    lineColor: '#4CAF50',
                    secondaryColor: '#2196F3',
                    tertiaryColor: '#FF9800',
                    background: 'rgba(255, 255, 255, 0.05)',
                    mainBkg: 'rgba(0, 0, 0, 0.3)',
                    secondBkg: 'rgba(255, 255, 255, 0.1)',
                    textColor: '#fff',
                    border1: '#666',
                    border2: '#999',
                    fontFamily: 'Arial, sans-serif'
                },
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis',
                    nodeSpacing: 100,
                    rankSpacing: 80
                },
                securityLevel: 'loose'
            });

            // Add custom CSS - remove problematic hover effects that cause jumping
            const style = document.createElement('style');
            style.textContent = '.mermaid svg{max-width:100%!important;height:auto!important}.mermaid .node{cursor:pointer!important}.mermaid .edge{stroke-width:2px!important}';
            document.head.appendChild(style);

            // Render diagram and add interactivity
            setTimeout(() => {
                const mermaidElements = modalContent.querySelectorAll('.mermaid');
                if (mermaidElements.length > 0) {
                    mermaid.init(undefined, mermaidElements).then(() => {
                        // Add click handlers after diagram is rendered
                        addDiagramInteractivity();
                    });
                }
            }, 200);

            const addDiagramInteractivity = () => {
                // Add click handlers to nodes
                const nodes = modalContent.querySelectorAll('.mermaid .node');
                nodes.forEach(node => {
                    node.addEventListener('click', (e) => {
                        e.preventDefault();
                        const nodeText = node.textContent || node.innerText;
                        showNodeDetails(nodeText);
                    });

                    // Add subtle hover effect (no jumping)
                    node.addEventListener('mouseenter', () => {
                        node.style.opacity = '0.8';
                    });

                    node.addEventListener('mouseleave', () => {
                        node.style.opacity = '1';
                    });
                });
            };

            const showNodeDetails = (nodeText) => {
                if (nodeText.includes('MEMORY')) {
                    // Show detailed memory flowchart modal
                    showMemoryFlowchartModal();
                } else {
                    let details = '';

                    if (nodeText.includes('YOU')) {
                        details = '👤 YOU: The user at the center of everything. Your needs drive the entire system.';
                    } else if (nodeText.includes('AGENT')) {
                        details = '🎯 AGENT: The intelligent supervisor that coordinates all agents and manages conversations.';
                    } else if (nodeText.includes('FINANCE')) {
                        details = '💰 FINANCE Agent: Connects to your real financial data via Plaid, analyzes spending patterns without judgment.';
                    } else if (nodeText.includes('WEALTH')) {
                        details = '🎓 WEALTH Agent: Your personal financial coach that adapts communication style based on your personality.';
                    } else if (nodeText.includes('GOALS')) {
                        details = '📊 GOALS Agent: Helps build budgets that work for your life, remembering your preferences.';
                    }

                    if (details) {
                        alert(details);
                    }
                }
            };

            const showMemoryFlowchartModal = () => {
                // Create detailed memory flowchart modal
                const memoryModal = document.createElement('div');
                memoryModal.id = 'memory-flowchart-modal';
                memoryModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    font-family: 'Arial', sans-serif;
                    overflow-y: auto;
                `;

                const memoryModalContent = document.createElement('div');
                memoryModalContent.style.cssText = `
                    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 1000px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 3px solid #FFC107;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                    position: relative;
                    color: #fff;
                    margin: 20px;
                `;

                memoryModalContent.innerHTML = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #FFC107; margin-bottom: 10px; font-size: 2.2em; font-weight: bold;">🧠 Memory Pipeline Flow</h1>
                        <div style="width: 100px; height: 4px; background: #FFC107; margin: 0 auto; border-radius: 2px;"></div>
                        <p style="color: #ccc; margin-top: 15px; font-size: 1.1em;">How episodic and semantic memories are created and managed</p>
                    </div>

                    <!-- Detailed Memory Flowchart -->
                    <div style="margin-bottom: 30px;">
                        <div class="memory-mermaid" style="width: 100%; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; border: 1px solid #444; min-height: 500px;">
                            graph TD
                                A[💬 User Asks<br/>What is my spending pattern?] --> B[🧠 Memory System<br/>Searches and Retrieves]
                                B --> C[📝 Injects Context<br/>• You prefer coffee shops over chains<br/>• Last month: $120 dining out<br/>• Goal: Save $500 this month]

                                C --> D[🎯 Supervisor Agent<br/>Makes Personalized Response]
                                D --> E[💰 Based on your preferences<br/>I recommend these budget adjustments]

                                E --> F[📚 Episodic Memory<br/>Captures This Interaction]
                                F --> G[🔄 Next Time<br/>Remembers our conversation<br/>about your coffee spending]

                                classDef userClass fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:white
                                classDef memoryClass fill:#FFC107,stroke:#FF8F00,stroke-width:2px,color:black
                                classDef agentClass fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:white
                                classDef episodicClass fill:#00BCD4,stroke:#0097A7,stroke-width:2px,color:white

                                A:::userClass
                                B:::memoryClass
                                C:::memoryClass
                                D:::agentClass
                                E:::agentClass
                                F:::episodicClass
                                G:::episodicClass
                        </div>
                    </div>

                    <!-- Impact-Focused Component Explanations -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
                        <div style="padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border-left: 4px solid #4CAF50;">
                            <h3 style="color: #4CAF50; margin-bottom: 10px;">🎯 Personalization Impact</h3>
                            <ul style="color: #ccc; margin: 0; padding-left: 20px;">
                                <li>Remembers your unique financial preferences</li>
                                <li>Adapts communication style to your personality</li>
                                <li>Provides contextually relevant advice</li>
                                <li>Creates truly personalized financial guidance</li>
                            </ul>
                        </div>

                        <div style="padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border-left: 4px solid #FFC107;">
                            <h3 style="color: #FFC107; margin-bottom: 10px;">🧠 Learning & Growth</h3>
                            <ul style="color: #ccc; margin: 0; padding-left: 20px;">
                                <li>Builds knowledge from every conversation</li>
                                <li>Identifies patterns in your financial behavior</li>
                                <li>Evolves recommendations based on your progress</li>
                                <li>Helps you develop better financial habits</li>
                            </ul>
                        </div>

                        <div style="padding: 20px; background: rgba(33, 150, 243, 0.1); border-radius: 8px; border-left: 4px solid #2196F3;">
                            <h3 style="color: #2196F3; margin-bottom: 10px;">⚡ Efficiency Gains</h3>
                            <ul style="color: #ccc; margin: 0; padding-left: 20px;">
                                <li>Reduces repetitive explanations</li>
                                <li>Provides instant context for complex topics</li>
                                <li>Streamlines ongoing financial discussions</li>
                                <li>Saves time while maintaining quality</li>
                            </ul>
                        </div>

                        <div style="padding: 20px; background: rgba(156, 39, 176, 0.1); border-radius: 8px; border-left: 4px solid #9C27B0;">
                            <h3 style="color: #9C27B0; margin-bottom: 10px;">💝 Trust Building</h3>
                            <ul style="color: #ccc; margin: 0; padding-left: 20px;">
                                <li>Shows genuine understanding of your situation</li>
                                <li>Maintains consistency across conversations</li>
                                <li>Demonstrates care for your financial well-being</li>
                                <li>Creates reliable, dependable financial guidance</li>
                            </ul>
                        </div>
                    </div>


                    <div style="text-align: center; margin-top: 30px;">
                        <button id="close-memory-modal-btn" style="
                            background: linear-gradient(135deg, #FFC107, #FF8F00);
                            color: #000;
                            border: none;
                            padding: 15px 40px;
                            border-radius: 12px;
                            cursor: pointer;
                            font-size: 18px;
                            font-weight: bold;
                            transition: all 0.3s;
                            min-width: 120px;
                            min-height: 50px;
                            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.3)';">Close Memory Details</button>
                    </div>
                `;

                memoryModal.appendChild(memoryModalContent);
                document.body.appendChild(memoryModal);

                // Add close functionality
                const closeMemoryBtn = memoryModalContent.querySelector('#close-memory-modal-btn');
                const closeMemoryModal = () => {
                    memoryModal.remove();
                };

                closeMemoryBtn.onclick = closeMemoryModal;

                memoryModal.onclick = (e) => {
                    if (e.target === memoryModal) {
                        closeMemoryModal();
                    }
                };

                document.addEventListener('keydown', (e) => {
                    if (e.code === 'Escape') {
                        closeMemoryModal();
                    }
                });

                // Initialize the memory flowchart
                setTimeout(() => {
                    const memoryMermaidElements = memoryModalContent.querySelectorAll('.memory-mermaid');
                    if (memoryMermaidElements.length > 0 && typeof mermaid !== 'undefined') {
                        mermaid.init(undefined, memoryMermaidElements);
                    }
                }, 200);
            };
        };

        // Initialize Mermaid with a small delay to ensure it's loaded
        setTimeout(() => {
            if (typeof mermaid !== 'undefined') {
                initializeMermaid();
            } else {
                console.log('Mermaid not loaded, trying again...');
                setTimeout(() => initializeMermaid(), 1000);
            }
        }, 100);
    } else {
        // Standard modal for other projects
        contentDiv = document.createElement('div');
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

        modalContent.appendChild(contentDiv);
    }

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