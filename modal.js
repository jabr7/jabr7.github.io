// Modal system module - HTML modal functions
export { showProjectModal, showControlsModal, showWelcomeModal };

// Project details modal
function showProjectModal(content, switchToFollowMode) {
    // Check if this is the special project for enhanced presentation
    const isSpecialProject = content.id === 4;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'project-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    `;

    // Create modal content - much larger for the special project
    const modalContent = document.createElement('div');
    const modalWidth = isSpecialProject ? '95%' : '90%';
    const maxWidth = isSpecialProject ? '1200px' : '700px';

    modalContent.style.cssText = `
        background: rgba(12, 12, 14, 0.86);
        border-radius: 14px;
        padding: ${isSpecialProject ? '40px' : '30px'};
        max-width: ${maxWidth};
        width: ${modalWidth};
        max-height: 90vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 30px 80px rgba(0,0,0,0.65);
        position: relative;
        color: #fff;
        margin: 20px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    // Declare contentDiv at function scope
    let contentDiv;

    // Enhanced content for the special project
    if (isSpecialProject) {
        contentDiv = document.createElement('div');
        contentDiv.innerHTML = `

            <div style="text-align: center; margin-bottom: 18px;">
                <h1 style="color: rgba(255,255,255,0.92); margin: 0 0 10px; font-size: 2.35em; font-weight: 650; font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: 0.01em;">${content.title}</h1>
                <div style="width: 84px; height: 1px; background: rgba(255,255,255,0.16); margin: 0 auto;"></div>
            </div>

            <!-- Problem Section -->
            <div style="margin-bottom: 14px; padding: 16px 16px 14px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Problem</div>
                <p style="margin: 0; color: rgba(255,255,255,0.78); font-size: 1.02em; line-height: 1.7;">${content.problem}</p>
            </div>

            <!-- Solution Section -->
            <div style="margin-bottom: 18px; padding: 16px 16px 14px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Solution</div>
                <p style="margin: 0; color: rgba(255,255,255,0.78); font-size: 1.02em; line-height: 1.7;">${content.solution}</p>
            </div>

            <!-- Interactive Mermaid Architecture Diagram -->
            <div style="margin-bottom: 18px; padding: 18px 18px 14px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                <div style="text-align: center; color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;">System Architecture</div>

                <div id="mermaid-diagram" style="display: flex; justify-content: center; margin-bottom: 30px;">
                    <div class="mermaid" style="width: 100%; max-width: 900px; background: rgba(0,0,0,0.18); padding: 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); min-height: 520px;">
                        graph TD
                            %% Nodes
                            USER["User Input"]
                            INTENT["Intent Classifier<br/>(Cerebras Fast Path)"]
                            FAST["Fast Response Agent<br/>(Smalltalk)"]
                            SUPERVISOR["Supervisor Agent<br/>(Orchestrator)"]
                            
                            FINANCE["Finance Agent<br/>(SQL Gen)"]
                            CAPTURE["Capture Agent<br/>(Structured Data)"]
                            WEALTH["Wealth Agent<br/>(KB + Nav)"]
                            GOALS["Goal Agent<br/>(CRUD)"]
                            
                            MEMORY["Three-Tier Memory<br/>(Episodic, Semantic, Procedural)"]
                            COLD["Cold Path Processing<br/>(Background Workers)"]

                            %% Minimal monochrome styling
                            classDef userStyle fill:#0d0d10,stroke:#bdbdbd,stroke-width:2px,color:#ffffff
                            classDef supervisorStyle fill:#0d0d10,stroke:#e6e6e6,stroke-width:2px,color:#ffffff
                            classDef agentStyle fill:#0d0d10,stroke:#8c8c8c,stroke-width:2px,color:#ffffff
                            classDef memoryStyle fill:#0d0d10,stroke:#8c8c8c,stroke-width:2px,color:#ffffff
                            classDef fastStyle fill:#0d0d10,stroke:#666666,stroke-width:1px,color:#cccccc
                            classDef workerStyle fill:#0d0d10,stroke:#444444,stroke-dasharray: 5 5,color:#aaaaaa

                            USER:::userStyle
                            INTENT:::supervisorStyle
                            FAST:::fastStyle
                            SUPERVISOR:::supervisorStyle
                            FINANCE:::agentStyle
                            CAPTURE:::agentStyle
                            WEALTH:::agentStyle
                            GOALS:::agentStyle
                            MEMORY:::memoryStyle
                            COLD:::workerStyle

                            %% Connections
                            USER --> INTENT
                            INTENT -- "Smalltalk" --> FAST
                            INTENT -- "Task" --> SUPERVISOR
                            
                            SUPERVISOR <--> MEMORY
                            SUPERVISOR -- "Async Payload" --> COLD
                            COLD --> MEMORY
                            
                            SUPERVISOR --> FINANCE
                            SUPERVISOR --> CAPTURE
                            SUPERVISOR --> WEALTH
                            SUPERVISOR --> GOALS

                            subgraph AGENTS["Specialized Agent Cluster (State Isolated)"]
                                FINANCE
                                CAPTURE
                                WEALTH
                                GOALS
                            end
                    </div>
                </div>

                <!-- Diagram Legend -->
                <div style="text-align: center; margin-top: 12px; font-size: 0.9em; color: rgba(255,255,255,0.62);">
                    <strong>A high-concurrency architecture using LangGraph for multi-agent delegation.</strong>
                </div>

                <!-- Agent Descriptions -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 24px;">
                    <div style="padding: 15px; background: rgba(255, 152, 0, 0.06); border-radius: 8px; border-left: 3px solid #FF9800;">
                        <h4 style="color: #FF9800; margin-bottom: 8px;">💰 Finance Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Dynamic SQL generation over mirrored financial data. Uses procedural memory for complex query patterns while maintaining strict user isolation.</p>
                    </div>
                    <div style="padding: 15px; background: rgba(33, 150, 243, 0.06); border-radius: 8px; border-left: 3px solid #2196F3;">
                        <h4 style="color: #2196F3; margin-bottom: 8px;">📥 Capture Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Converts natural language into structured financial entries (assets, liabilities, transactions) with multi-intent extraction and validation.</p>
                    </div>
                    <div style="padding: 15px; background: rgba(156, 39, 176, 0.06); border-radius: 8px; border-left: 3px solid #9C27B0;">
                        <h4 style="color: #9C27B0; margin-bottom: 8px;">📖 Wealth Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">RAG-based education engine. Combines internal product knowledge with external financial wisdom, emitting navigation events for proactive UX guidance.</p>
                    </div>
                    <div style="padding: 15px; background: rgba(255, 87, 34, 0.06); border-radius: 8px; border-left: 3px solid #FF5722;">
                        <h4 style="color: #FF5722; margin-bottom: 8px;">📊 Goal Agent</h4>
                        <p style="margin: 0; color: #ccc; font-size: 0.9em;">Persistent state management for financial objectives. Handles complex status transitions and cross-session budget tracking.</p>
                    </div>
                </div>
            </div>

            <!-- Timeline and Technologies -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
                <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                    <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Timeline</div>
                    <p style="margin: 0; color: rgba(255,255,255,0.86); font-weight: 600;">${content.timeline}</p>
                </div>
                <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                    <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Technologies</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        <span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">LangGraph</span>
                        <span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">AWS Bedrock</span>
                        <span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">Cerebras</span>
                        <span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">FastAPI</span>
                        <span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">S3 Vector Store</span>
                    </div>
                </div>
            </div>

            <!-- Key Features -->
            <div style="margin-bottom: 18px; padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px;">Key Architectural Pillars</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px;">
                    <div>
                        <strong style="color: rgba(255,255,255,0.92); font-weight: 600; display: block; margin-bottom: 4px;">Three-Tier Memory</strong>
                        <small style="color: rgba(255,255,255,0.62);">Episodic, Semantic, and Procedural retrieval for hyper-personalization.</small>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.92); font-weight: 600; display: block; margin-bottom: 4px;">Multi-Model Strategy</strong>
                        <small style="color: rgba(255,255,255,0.62);">Cerebras for low-latency routing; AWS Bedrock for complex reasoning.</small>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.92); font-weight: 600; display: block; margin-bottom: 4px;">State Isolation</strong>
                        <small style="color: rgba(255,255,255,0.62);">Agents operate on scoped data to maximize context window and accuracy.</small>
                    </div>
                    <div>
                        <strong style="color: rgba(255,255,255,0.92); font-weight: 600; display: block; margin-bottom: 4px;">Dynamic SQL Gen</strong>
                        <small style="color: rgba(255,255,255,0.62);">In-context learning for accurate financial data analysis without hardcoding.</small>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 14px;">
                <button id="close-modal-btn" style="
                    background: rgba(255,255,255,0.92);
                    color: rgba(0,0,0,0.92);
                    border: 1px solid rgba(255,255,255,0.10);
                    padding: 12px 18px;
                    border-radius: 999px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: transform 160ms ease, opacity 160ms ease;
                    min-width: 120px;
                    min-height: 42px;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.45);
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    opacity: 0.95;
                ">Close</button>
            </div>

        `;

        modalContent.appendChild(contentDiv);

        // Initialize Mermaid.js (now loaded in HTML head)
        const initializeMermaid = () => {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                themeVariables: {
                    primaryColor: '#0d0d10',
                    primaryTextColor: 'rgba(255,255,255,0.92)',
                    primaryBorderColor: 'rgba(255,255,255,0.22)',
                    lineColor: 'rgba(255,255,255,0.22)',
                    secondaryColor: '#0d0d10',
                    tertiaryColor: '#0d0d10',
                    background: 'rgba(255,255,255,0.04)',
                    mainBkg: 'rgba(12, 12, 14, 0.86)',
                    secondBkg: 'rgba(255,255,255,0.04)',
                    textColor: 'rgba(255,255,255,0.92)',
                    border1: 'rgba(255,255,255,0.14)',
                    border2: 'rgba(255,255,255,0.22)',
                    fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
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
                if (nodeText.includes('Memory')) {
                    // Show detailed memory flowchart modal
                    showMemoryFlowchartModal();
                } else {
                    let details = '';

                    if (nodeText.includes('Input')) {
                        details = 'User Input: The starting point for all interactions, processed through safety guardrails.';
                    } else if (nodeText.includes('Intent')) {
                        details = 'Intent Classifier: A Cerebras-powered router that distinguishes between smalltalk (Fast Path) and complex tasks in <100ms.';
                    } else if (nodeText.includes('Fast')) {
                        details = 'Fast Response Agent: A low-latency model optimized for conversational smalltalk and quick acknowledgments.';
                    } else if (nodeText.includes('Supervisor')) {
                        details = 'Supervisor Agent: The central orchestrator that manages state isolation and delegates complex tasks to specialized agents.';
                    } else if (nodeText.includes('Finance')) {
                        details = 'Finance Agent: Generates dynamic SQL to query mirrored financial data, providing deep insights into spending and net worth.';
                    } else if (nodeText.includes('Capture')) {
                        details = 'Capture Agent: Uses advanced extraction to turn natural language into structured financial records (assets, liabilities, transactions).';
                    } else if (nodeText.includes('Wealth')) {
                        details = 'Wealth Agent: A financial educator that uses RAG to retrieve information from a curated knowledge base and guides users through the app.';
                    } else if (nodeText.includes('Goal')) {
                        details = 'Goal Agent: Tracks and manages persistent financial objectives across conversation sessions.';
                    } else if (nodeText.includes('Cold')) {
                        details = 'Cold Path Processing: Asynchronous background workers that handle expensive memory merging, novelty detection, and profile synchronization without blocking the user response.';
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
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    touch-action: pan-y;
                `;

                const memoryModalContent = document.createElement('div');
                memoryModalContent.style.cssText = `
                    background: rgba(12, 12, 14, 0.86);
                    border-radius: 14px;
                    padding: 30px;
                    max-width: 1000px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    touch-action: pan-y;
                    border: 1px solid rgba(255,255,255,0.14);
                    box-shadow: 0 30px 80px rgba(0,0,0,0.65);
                    position: relative;
                    color: rgba(255,255,255,0.92);
                    margin: 20px;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                `;

                memoryModalContent.innerHTML = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 2.2em; font-weight: 650; font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: 0.01em;">Memory Pipeline Flow</h1>
                        <div style="width: 84px; height: 1px; background: rgba(255,255,255,0.16); margin: 0 auto;"></div>
                        <p style="color: rgba(255,255,255,0.72); margin-top: 15px; font-size: 1.05em; line-height: 1.65;">How episodic and semantic memories are created and managed</p>
                    </div>

                    <!-- Detailed Memory Flowchart -->
                    <div style="margin-bottom: 30px;">
                        <div class="memory-mermaid" style="width: 100%; background: rgba(255,255,255,0.04); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.10); min-height: 500px;">
                            graph TD
                                A["User Asks<br/>What is my spending pattern?"] --> B["Memory System<br/>Context Injection"]
                                B --> C["Retrieve Tiers<br/>• Semantic: You prefer coffee shops<br/>• Episodic: Last week's budget talk<br/>• Procedural: SQL query patterns"]

                                C --> D["Supervisor Agent<br/>State Isolation & Delegation"]
                                D --> E["Agent Action<br/>Dynamic SQL Gen / KB Search"]

                                E --> F["Episodic Capture<br/>Background Processing"]
                                F --> G["Continuous Learning<br/>Profile Sync & Memory Merge"]

                                classDef userClass fill:#0d0d10,stroke:rgba(255,255,255,0.22),stroke-width:2px,color:rgba(255,255,255,0.92)
                                classDef memoryClass fill:#0d0d10,stroke:rgba(255,255,255,0.22),stroke-width:2px,color:rgba(255,255,255,0.92)
                                classDef agentClass fill:#0d0d10,stroke:rgba(255,255,255,0.22),stroke-width:2px,color:rgba(255,255,255,0.92)
                                classDef episodicClass fill:#0d0d10,stroke:rgba(255,255,255,0.22),stroke-width:2px,color:rgba(255,255,255,0.92)

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
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-bottom: 30px;">
                        <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                            <h3 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 1.05em; font-weight: 600;">Personalization Impact</h3>
                            <ul style="color: rgba(255,255,255,0.72); margin: 0; padding-left: 20px; line-height: 1.75;">
                                <li>Remembers your unique financial preferences</li>
                                <li>Adapts communication style to your personality</li>
                                <li>Provides contextually relevant advice</li>
                                <li>Creates truly personalized financial guidance</li>
                            </ul>
                        </div>

                        <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                            <h3 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 1.05em; font-weight: 600;">Learning & Growth</h3>
                            <ul style="color: rgba(255,255,255,0.72); margin: 0; padding-left: 20px; line-height: 1.75;">
                                <li>Builds knowledge from every conversation</li>
                                <li>Identifies patterns in your financial behavior</li>
                                <li>Evolves recommendations based on your progress</li>
                                <li>Helps you develop better financial habits</li>
                            </ul>
                        </div>

                        <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                            <h3 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 1.05em; font-weight: 600;">Efficiency Gains</h3>
                            <ul style="color: rgba(255,255,255,0.72); margin: 0; padding-left: 20px; line-height: 1.75;">
                                <li>Reduces repetitive explanations</li>
                                <li>Provides instant context for complex topics</li>
                                <li>Streamlines ongoing financial discussions</li>
                                <li>Saves time while maintaining quality</li>
                            </ul>
                        </div>

                        <div style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                            <h3 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 1.05em; font-weight: 600;">Trust Building</h3>
                            <ul style="color: rgba(255,255,255,0.72); margin: 0; padding-left: 20px; line-height: 1.75;">
                                <li>Shows genuine understanding of your situation</li>
                                <li>Maintains consistency across conversations</li>
                                <li>Demonstrates care for your financial well-being</li>
                                <li>Creates reliable, dependable financial guidance</li>
                            </ul>
                        </div>
                    </div>


                    <div style="text-align: center; margin-top: 30px;">
                        <button id="close-memory-modal-btn" style="
                            background: rgba(255,255,255,0.92);
                            color: rgba(0,0,0,0.92);
                            border: 1px solid rgba(255,255,255,0.10);
                            padding: 12px 18px;
                            border-radius: 999px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 600;
                            transition: transform 160ms ease, opacity 160ms ease;
                            min-width: 120px;
                            min-height: 42px;
                            opacity: 0.95;
                            -webkit-tap-highlight-color: transparent;
                            -webkit-touch-callout: none;
                            -webkit-user-select: none;
                            -moz-user-select: none;
                            -ms-user-select: none;
                            user-select: none;
                        ">Close</button>
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
                closeMemoryBtn.addEventListener('mouseenter', () => {
                    closeMemoryBtn.style.opacity = '1';
                    closeMemoryBtn.style.transform = 'translateY(-1px)';
                });
                closeMemoryBtn.addEventListener('mouseleave', () => {
                    closeMemoryBtn.style.opacity = '0.95';
                    closeMemoryBtn.style.transform = 'translateY(0)';
                });

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
            <div style="text-align: center; margin-bottom: 18px;">
                <h1 style="color: rgba(255,255,255,0.92); margin: 0 0 10px; font-size: 2.0em; font-weight: 650; font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: 0.01em;">${content.title}</h1>
                <div style="width: 84px; height: 1px; background: rgba(255,255,255,0.16); margin: 0 auto;"></div>
            </div>

            <div style="display: grid; gap: 14px; margin-bottom: 18px;">
                <section style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                    <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Problem</div>
                    <p style="margin: 0; color: rgba(255,255,255,0.78); line-height: 1.65;">${content.problem}</p>
                </section>

                <section style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                    <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Solution</div>
                    <p style="margin: 0; color: rgba(255,255,255,0.78); line-height: 1.65;">${content.solution}</p>
                </section>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <section style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                        <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Timeline</div>
                        <p style="margin: 0; color: rgba(255,255,255,0.86); font-weight: 600;">${content.timeline}</p>
                    </section>
                    <section style="padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
                        <div style="color: rgba(255,255,255,0.68); font-size: 0.82em; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px;">Technologies</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${content.tags.map(tag => `<span style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.74); padding: 5px 10px; border-radius: 999px; font-size: 0.78em; border: 1px solid rgba(255,255,255,0.12);">${tag}</span>`).join('')}
                        </div>
                    </section>
                </div>
            </div>

            <div style="text-align: center; margin-top: 10px;">
                <button id="close-modal-btn" style="
                    background: rgba(255,255,255,0.92);
                    color: rgba(0,0,0,0.92);
                    border: 1px solid rgba(255,255,255,0.10);
                    padding: 12px 18px;
                    border-radius: 999px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: transform 160ms ease, opacity 160ms ease;
                    min-width: 120px;
                    min-height: 42px;
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    opacity: 0.95;
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
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
        closeBtn.style.transform = 'translateY(-1px)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.95';
        closeBtn.style.transform = 'translateY(0)';
    });

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
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: rgba(12, 12, 14, 0.86);
        border-radius: 14px;
        padding: 28px 26px 22px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 30px 80px rgba(0,0,0,0.65);
        position: relative;
        color: #fff;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    // Content with controls
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        <h1 style="color: rgba(255,255,255,0.92); margin-bottom: 18px; font-size: 1.6em; font-weight: 650; text-align: center; font-family: 'Fraunces', ui-serif, Georgia, serif;">Controls</h1>

        <div style="display: ${isMobile ? 'none' : 'block'};">
            <h2 style="color: rgba(255,255,255,0.72); margin: 0 0 12px; font-size: 0.9em; letter-spacing: 0.14em; text-transform: uppercase;">Desktop</h2>
            <div style="margin-bottom: 18px; line-height: 1.75; color: rgba(255,255,255,0.72);">
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">WASD / Arrows</strong> — sail</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Shift</strong> — boost</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">E</strong> — open buoy</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">C</strong> — camera</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Mouse</strong> — orbit</div>
                <div style="margin-bottom: 0;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Scroll</strong> — zoom</div>
            </div>
        </div>

        <div style="display: ${isMobile ? 'block' : 'none'};">
            <h2 style="color: rgba(255,255,255,0.72); margin: 0 0 12px; font-size: 0.9em; letter-spacing: 0.14em; text-transform: uppercase;">Mobile</h2>
            <div style="margin-bottom: 18px; line-height: 1.75; color: rgba(255,255,255,0.72);">
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">D‑pad</strong> — sail</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Boost</strong> — faster</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">E</strong> — open buoy</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">C</strong> — camera</div>
                <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Drag</strong> — orbit</div>
                <div style="margin-bottom: 0;"><strong style="color: rgba(255,255,255,0.9); font-weight: 600;">Pinch</strong> — zoom</div>
            </div>
        </div>

        <div style="margin-bottom: 16px; padding: 14px 14px 12px; background: rgba(255,255,255,0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
            <h3 style="color: rgba(255,255,255,0.86); margin: 0 0 10px; font-size: 0.9em; letter-spacing: 0.14em; text-transform: uppercase;">Tips</h3>
            <div style="line-height: 1.75; color: rgba(255,255,255,0.72);">
                <div style="margin-bottom: 6px;">Find buoys, approach, press <strong style="color: rgba(255,255,255,0.9); font-weight: 600;">E</strong>.</div>
                <div style="margin-bottom: 6px;">Use <strong style="color: rgba(255,255,255,0.9); font-weight: 600;">C</strong> to switch follow/orbit.</div>
                <div style="opacity: 0.85;">Buoy shades indicate state: new, ready, visited.</div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <button id="close-controls-btn" style="
                background: rgba(255,255,255,0.92);
                color: rgba(0,0,0,0.92);
                border: 1px solid rgba(255,255,255,0.10);
                padding: 12px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: transform 160ms ease, opacity 160ms ease;
                min-width: 120px;
                -webkit-tap-highlight-color: transparent;
                opacity: 0.95;
            ">Close</button>
        </div>
    `;

    // Get close button and add handler
    const closeBtn = contentDiv.querySelector('#close-controls-btn');
    const closeModal = () => {
        modal.remove();
    };

    closeBtn.onclick = closeModal;
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
        closeBtn.style.transform = 'translateY(-1px)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.95';
        closeBtn.style.transform = 'translateY(0)';
    });

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

// Welcome modal for first-time visitors
function showWelcomeModal() {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.88);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: rgba(12, 12, 14, 0.86);
        border-radius: 14px;
        padding: 34px 32px 28px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 30px 80px rgba(0,0,0,0.65);
        position: relative;
        color: #fff;
        text-align: center;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
        <div style="margin-bottom: 30px;">
            <h1 style="color: rgba(255,255,255,0.92); margin-bottom: 10px; font-size: 2.05em; font-weight: 650; font-family: 'Fraunces', ui-serif, Georgia, serif; letter-spacing: 0.01em;">Welcome</h1>
            <div style="width: 84px; height: 1px; background: rgba(255,255,255,0.16); margin: 0 auto;"></div>
        </div>

        <p style="color: rgba(255,255,255,0.72); font-size: 1.05em; line-height: 1.65; margin-bottom: 26px;">
            I'm Joaquin Bonifacino. This is an interactive 3D ocean where you can explore my projects.
        </p>

        <div style="text-align: left; margin-bottom: 26px; padding: 18px 18px 16px; background: rgba(255, 255, 255, 0.04); border-radius: 12px; border: 1px solid rgba(255,255,255,0.10);">
            <h2 style="color: rgba(255,255,255,0.86); margin: 0 0 12px; font-size: 0.95em; letter-spacing: 0.14em; text-transform: uppercase;">How to explore</h2>
            <div style="line-height: 1.85; color: rgba(255,255,255,0.72);">
                <div style="margin-bottom: 8px;"><span style="opacity:0.7;">1.</span> Use <strong>WASD</strong> / <strong>Arrow Keys</strong> to sail</div>
                <div style="margin-bottom: 8px;"><span style="opacity:0.7;">2.</span> Approach a buoy and press <strong>E</strong></div>
                <div style="margin-bottom: 0;"><span style="opacity:0.7;">3.</span> Use <strong>C</strong> to switch camera mode</div>
            </div>
        </div>

        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button id="start-exploring-btn" style="
                background: rgba(255,255,255,0.92);
                color: rgba(0,0,0,0.92);
                border: 1px solid rgba(255,255,255,0.10);
                padding: 12px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: transform 160ms ease, opacity 160ms ease;
                min-width: 140px;
                min-height: 42px;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                opacity: 0.95;
            ">Start</button>
            
            <button id="view-controls-btn" style="
                background: rgba(255, 255, 255, 0.06);
                color: rgba(255,255,255,0.86);
                border: 1px solid rgba(255,255,255,0.14);
                padding: 12px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
                min-width: 140px;
                min-height: 42px;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            ">Controls</button>
        </div>
    `;

    // Get buttons and add handlers
    const startBtn = contentDiv.querySelector('#start-exploring-btn');
    const controlsBtn = contentDiv.querySelector('#view-controls-btn');
    
    const closeModal = () => {
        modal.remove();
    };

    startBtn.onclick = closeModal;
    
    controlsBtn.onclick = () => {
        closeModal();
        // Call showControlsModal directly since it's in the same file
        showControlsModal();
    };

    startBtn.addEventListener('mouseenter', () => {
        startBtn.style.opacity = '1';
        startBtn.style.transform = 'translateY(-1px)';
    });
    startBtn.addEventListener('mouseleave', () => {
        startBtn.style.opacity = '0.95';
        startBtn.style.transform = 'translateY(0)';
    });

    controlsBtn.addEventListener('mouseenter', () => {
        controlsBtn.style.transform = 'translateY(-1px)';
        controlsBtn.style.background = 'rgba(255,255,255,0.08)';
        controlsBtn.style.borderColor = 'rgba(255,255,255,0.22)';
    });
    controlsBtn.addEventListener('mouseleave', () => {
        controlsBtn.style.transform = 'translateY(0)';
        controlsBtn.style.background = 'rgba(255,255,255,0.06)';
        controlsBtn.style.borderColor = 'rgba(255,255,255,0.14)';
    });

    // Add touch events for mobile
    [startBtn, controlsBtn].forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            btn.click();
        }, { passive: false });
    });

    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };

    // Close on escape
    const escapeHandler = (e) => {
        if (e.code === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    modalContent.appendChild(contentDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}