document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fault-form');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const healthStatus = document.getElementById('health-status');
    const customLoadingOverlay = document.getElementById('custom-loading-overlay');
    const loadingAudio = document.getElementById('loading-audio');

    // Check server health on page load
    checkServerHealth();

    // Check server health every 30 seconds
    setInterval(checkServerHealth, 30000);

    // Function to check server health
    async function checkServerHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.status === 'ok') {
                healthStatus.textContent = 'Server Status: Online';
                healthStatus.className = 'status online';
            } else {
                healthStatus.textContent = 'Server Status: Offline';
                healthStatus.className = 'status offline';
            }
        } catch (error) {
            healthStatus.textContent = 'Server Status: Offline';
            healthStatus.className = 'status offline';
        }
    }

    // Function to show custom loading overlay
    function showCustomLoading() {
        customLoadingOverlay.style.display = 'flex';
        loadingAudio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });
    }

    // Function to hide custom loading overlay
    function hideCustomLoading() {
        customLoadingOverlay.style.display = 'none';
        loadingAudio.pause();
        loadingAudio.currentTime = 0;
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const equipment = document.getElementById('equipment').value;
        const code = document.getElementById('code').value;
        
        // Validate inputs
        if (!equipment || !code) {
            showError('Please enter both equipment type and fault code');
            return;
        }
        
        // Show loading screens
        showCustomLoading();
        loadingDiv.style.display = 'flex';
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        try {
            // Send request to server using the direct ChatGPT integration
            const response = await fetch('/api/analyze-direct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ equipment, code })
            });
            
            // Hide loading screens
            hideCustomLoading();
            loadingDiv.style.display = 'none';
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze fault code');
            }
            
            const data = await response.json();
            
            // Display result - prioritize the analysis field from ChatGPT
            if (data.analysis) {
                resultDiv.innerHTML = formatAnalysisOutput(data.analysis, code, equipment);
            } else if (data.description) {
                resultDiv.innerHTML = `<h2>Analysis for ${code}</h2><pre>${data.description}</pre>`;
            } else {
                resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            }
            resultDiv.style.display = 'block';
        } catch (error) {
            hideCustomLoading();
            showError(error.message);
        }
    });

    // Function to format the analysis output nicely
    function formatAnalysisOutput(analysis, code, equipment) {
        // Replace newlines with HTML line breaks for proper display
        const formattedAnalysis = analysis.replace(/\n/g, '<br>');
        
        return `
            <div class="analysis-result">
                <h2>AI Analysis for ${code} (${equipment})</h2>
                <div class="analysis-content">
                    ${formattedAnalysis}
                </div>
                <div class="analysis-footer">
                    <small>Analysis provided by AI - ${new Date().toLocaleString()}</small>
                </div>
            </div>
        `;
    }

    // Function to show error message
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'none';
    }

    // Pixel Canvas Functionality
    const pixelCanvasButton = document.getElementById('pixel-canvas-button');
    const pixelCanvasContainer = document.getElementById('pixel-canvas-container');
    const closeCanvasButton = document.getElementById('close-canvas');
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const cooldownTimer = document.getElementById('cooldown-timer');
    const adminButton = document.getElementById('admin-button');
    
    // Admin button functionality
    if (adminButton) {
        adminButton.addEventListener('click', () => {
            window.location.href = '/admin.html';
        });
    }
    
    const CANVAS_SIZE = 100; // 100x100 pixels
    const PIXEL_SIZE = 5;
    let canPlacePixel = true;
    let cooldownSeconds = 0;
    let cooldownInterval;
    let pixelRefreshInterval;
    let pixelsData = []; // Store pixel data including timestamps
    let tooltipElement;
    
    // Initialize canvas
    function initCanvas() {
        canvas.width = CANVAS_SIZE * PIXEL_SIZE;
        canvas.height = CANVAS_SIZE * PIXEL_SIZE;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create tooltip element if it doesn't exist
        if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.id = 'pixel-tooltip';
            tooltipElement.style.position = 'absolute';
            tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            tooltipElement.style.color = 'white';
            tooltipElement.style.padding = '5px 10px';
            tooltipElement.style.borderRadius = '4px';
            tooltipElement.style.fontSize = '12px';
            tooltipElement.style.pointerEvents = 'none';
            tooltipElement.style.zIndex = '1000';
            tooltipElement.style.display = 'none';
            document.body.appendChild(tooltipElement);
        }
        
        // Add color preset buttons
        createColorButtons();
        
        // Load existing pixels
        fetchPixels();
        
        // Start periodic pixel refresh
        startPixelRefresh();
    }
    
    // Create color preset buttons
    function createColorButtons() {
        const toolsDiv = document.getElementById('pixel-canvas-tools');
        const existingPresets = document.getElementById('color-presets');
        
        // If color presets already exist, don't recreate them
        if (existingPresets) return;
        
        // Create color presets container
        const colorsContainer = document.createElement('div');
        colorsContainer.id = 'color-presets';
        colorsContainer.style.display = 'flex';
        colorsContainer.style.flexWrap = 'wrap';
        colorsContainer.style.gap = '5px';
        colorsContainer.style.marginTop = '10px';
        colorsContainer.style.width = '100%';
        
        // Define common colors to use
        const colors = [
            { name: 'Black', value: '#000000' },
            { name: 'White', value: '#FFFFFF' },
            { name: 'Red', value: '#FF0000' },
            { name: 'Green', value: '#00FF00' },
            { name: 'Blue', value: '#0000FF' },
            { name: 'Yellow', value: '#FFFF00' },
            { name: 'Cyan', value: '#00FFFF' },
            { name: 'Magenta', value: '#FF00FF' },
            { name: 'Orange', value: '#FFA500' },
            { name: 'Purple', value: '#800080' },
            { name: 'Pink', value: '#FFC0CB' },
            { name: 'Brown', value: '#A52A2A' },
            { name: 'Gray', value: '#808080' },
            { name: 'Dark Green', value: '#006400' },
            { name: 'Navy', value: '#000080' }
        ];
        
        // Add color label
        const colorLabel = document.createElement('div');
        colorLabel.textContent = 'Quick Color Selection:';
        colorLabel.style.width = '100%';
        colorLabel.style.marginBottom = '5px';
        colorLabel.style.fontWeight = 'bold';
        
        colorsContainer.appendChild(colorLabel);
        
        // Create buttons for each color
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-btn';
            colorBtn.title = color.name;
            colorBtn.style.width = '30px';
            colorBtn.style.height = '30px';
            colorBtn.style.backgroundColor = color.value;
            colorBtn.style.border = '2px solid #ccc';
            colorBtn.style.borderRadius = '4px';
            colorBtn.style.cursor = 'pointer';
            colorBtn.style.padding = '0';
            colorBtn.style.margin = '2px';
            
            // Add a checkmark to the black button (default)
            if (color.value === colorPicker.value) {
                colorBtn.style.border = '2px solid #000';
                colorBtn.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
                colorBtn.innerHTML = '<span style="color: white; text-shadow: 1px 1px 1px black; display: flex; justify-content: center; align-items: center; height: 100%;">✓</span>';
            }
            
            // Set color on click
            colorBtn.addEventListener('click', () => {
                // Update color picker
                colorPicker.value = color.value;
                
                // Update button styles
                document.querySelectorAll('.color-btn').forEach(btn => {
                    btn.style.border = '2px solid #ccc';
                    btn.style.boxShadow = 'none';
                    btn.innerHTML = '';
                });
                
                // Highlight selected color
                colorBtn.style.border = '2px solid #000';
                colorBtn.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
                
                // Add checkmark - white for dark colors, black for light colors
                const isDarkColor = isColorDark(color.value);
                const checkmark = document.createElement('span');
                checkmark.style.color = isDarkColor ? 'white' : 'black';
                checkmark.style.textShadow = isDarkColor ? '1px 1px 1px black' : '1px 1px 1px white';
                checkmark.style.display = 'flex';
                checkmark.style.justifyContent = 'center';
                checkmark.style.alignItems = 'center';
                checkmark.style.height = '100%';
                checkmark.innerHTML = '✓';
                
                colorBtn.appendChild(checkmark);
            });
            
            colorsContainer.appendChild(colorBtn);
        });
        
        // Add manual picker section
        const customPickerContainer = document.createElement('div');
        customPickerContainer.style.display = 'flex';
        customPickerContainer.style.alignItems = 'center';
        customPickerContainer.style.marginTop = '10px';
        customPickerContainer.style.justifyContent = 'space-between';
        customPickerContainer.style.width = '100%';
        
        const customPickerLabel = document.createElement('label');
        customPickerLabel.textContent = 'Custom Color:';
        customPickerLabel.htmlFor = 'color-picker';
        
        // Move the existing color picker into our new container
        colorPicker.id = 'color-picker';
        customPickerContainer.appendChild(customPickerLabel);
        customPickerContainer.appendChild(colorPicker);
        
        // Listen for changes to the color picker
        colorPicker.addEventListener('input', () => {
            // When the color picker changes, update buttons
            const newColor = colorPicker.value;
            
            // Reset all buttons
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.style.border = '2px solid #ccc';
                btn.style.boxShadow = 'none';
                btn.innerHTML = '';
                
                // If button matches the new color, highlight it
                if (btn.style.backgroundColor === newColor) {
                    btn.style.border = '2px solid #000';
                    btn.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
                    
                    const isDarkColor = isColorDark(newColor);
                    btn.innerHTML = `<span style="color: ${isDarkColor ? 'white' : 'black'}; text-shadow: ${isDarkColor ? '1px 1px 1px black' : '1px 1px 1px white'}; display: flex; justify-content: center; align-items: center; height: 100%;">✓</span>`;
                }
            });
        });
        
        // Insert the containers before the cooldown timer
        toolsDiv.insertBefore(customPickerContainer, cooldownTimer);
        toolsDiv.insertBefore(colorsContainer, cooldownTimer);
    }
    
    // Helper function to determine if a color is dark
    function isColorDark(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate perceived brightness (ITU-R BT.709)
        const brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722);
        
        // Return true for dark colors
        return brightness < 128;
    }
    
    // Start periodic refresh of pixels
    function startPixelRefresh() {
        // Clear any existing interval
        if (pixelRefreshInterval) {
            clearInterval(pixelRefreshInterval);
        }
        
        // Set up new interval to fetch pixels every 5 seconds
        pixelRefreshInterval = setInterval(() => {
            fetchPixels();
        }, 5000);
    }
    
    // Stop periodic refresh of pixels
    function stopPixelRefresh() {
        if (pixelRefreshInterval) {
            clearInterval(pixelRefreshInterval);
            pixelRefreshInterval = null;
        }
    }
    
    // Show pixel canvas
    pixelCanvasButton.addEventListener('click', () => {
        pixelCanvasContainer.style.display = 'flex';
        initCanvas();
    });
    
    // Close pixel canvas
    closeCanvasButton.addEventListener('click', () => {
        pixelCanvasContainer.style.display = 'none';
        stopPixelRefresh();
        
        // Hide tooltip if visible
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    });
    
    // Handle mouse movement for tooltips
    canvas.addEventListener('mousemove', (e) => {
        if (!tooltipElement) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
        
        // Find pixel data for this position
        const pixelData = pixelsData.find(p => p.x === x && p.y === y);
        
        if (pixelData && pixelData.timestamp) {
            // Convert timestamp to Eastern Time
            const date = new Date(pixelData.timestamp);
            const options = { 
                timeZone: 'America/New_York',
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            
            const estTime = date.toLocaleString('en-US', options);
            
            // Show tooltip
            tooltipElement.textContent = `Placed on: ${estTime} (EST)`;
            tooltipElement.style.display = 'block';
            tooltipElement.style.left = `${e.clientX + 10}px`;
            tooltipElement.style.top = `${e.clientY + 10}px`;
        } else {
            // Hide tooltip if no pixel data found
            tooltipElement.style.display = 'none';
        }
    });
    
    // Hide tooltip when mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    });
    
    // Place a pixel
    canvas.addEventListener('click', (e) => {
        if (!canPlacePixel) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
        const color = colorPicker.value;
        
        placePixel(x, y, color);
    });
    
    // Place a pixel
    function placePixel(x, y, color) {
        if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return;
        
        // Draw the pixel
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        
        // Save the pixel to the server
        savePixel(x, y, color);
        
        // Start cooldown
        startCooldown();
    }
    
    // Start cooldown
    function startCooldown() {
        canPlacePixel = false;
        cooldownSeconds = 3;
        cooldownTimer.textContent = `Cooldown: ${cooldownSeconds}s`;
        
        cooldownInterval = setInterval(() => {
            cooldownSeconds--;
            
            if (cooldownSeconds <= 0) {
                clearInterval(cooldownInterval);
                canPlacePixel = true;
                cooldownTimer.textContent = 'Ready to place a pixel';
            } else {
                cooldownTimer.textContent = `Cooldown: ${cooldownSeconds}s`;
            }
        }, 1000);
    }
    
    // Fetch all pixels from server
    async function fetchPixels() {
        try {
            const response = await fetch('/api/pixels');
            if (!response.ok) throw new Error('Failed to fetch pixels');
            
            pixelsData = await response.json();
            
            // Draw all pixels
            pixelsData.forEach(pixel => {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            });
        } catch (error) {
            console.error('Error fetching pixels:', error);
        }
    }
    
    // Save a pixel to the server
    async function savePixel(x, y, color) {
        try {
            await fetch('/api/pixels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ x, y, color })
            });
        } catch (error) {
            console.error('Error saving pixel:', error);
        }
    }
}); 