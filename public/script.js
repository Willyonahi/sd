document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fault-form');
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const healthStatus = document.getElementById('health-status');

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
        
        // Show loading screen
        loadingDiv.style.display = 'flex';
        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        try {
            // Send request to server
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ equipment, code })
            });
            
            // Hide loading screen
            loadingDiv.style.display = 'none';
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to analyze fault code');
            }
            
            const data = await response.json();
            
            // Display result
            resultDiv.innerHTML = `<pre>${data.analysis}</pre>`;
            resultDiv.style.display = 'block';
        } catch (error) {
            showError(error.message);
        }
    });

    // Function to show error message
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'none';
    }
}); 