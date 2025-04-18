document.addEventListener('DOMContentLoaded', function() {
    const equipmentInput = document.getElementById('equipment');
    const codeInput = document.getElementById('code');
    const analyzeButton = document.getElementById('analyze');
    const resultDiv = document.getElementById('result');
    const analysisDiv = document.getElementById('analysis');
    const loadingDiv = document.getElementById('loading');

    // Check if the service is properly configured
    async function checkServiceStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.status === 'ok') {
                console.log('Service is running properly');
            } else {
                console.error('Service is not running properly');
            }
        } catch (error) {
            console.error('Error checking service status:', error);
        }
    }

    // Call the health check when the page loads
    checkServiceStatus();

    analyzeButton.addEventListener('click', async function() {
        const equipment = equipmentInput.value.trim();
        const code = codeInput.value.trim();

        if (!equipment || !code) {
            alert('Please enter both equipment and fault code');
            return;
        }

        // Show loading indicator with a longer message
        loadingDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        
        // Update loading message to indicate AI analysis
        const loadingMessage = loadingDiv.querySelector('span');
        if (loadingMessage) {
            loadingMessage.textContent = 'Analyzing fault code... This may take a moment.';
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ equipment, code })
            });

            const data = await response.json();

            // Hide loading indicator
            loadingDiv.classList.add('hidden');
            resultDiv.classList.remove('hidden');

            if (response.ok) {
                analysisDiv.innerHTML = `<div class="whitespace-pre-line">${data.analysis}</div>`;
            } else {
                analysisDiv.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p class="font-bold">Error</p>
                        <p>${data.error}</p>
                        ${data.details ? `<p class="text-sm mt-2">${data.details}</p>` : ''}
                    </div>
                `;
            }
        } catch (error) {
            // Hide loading indicator
            loadingDiv.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            
            analysisDiv.innerHTML = `
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <p class="font-bold">Error</p>
                    <p>Failed to connect to the server. Please try again later.</p>
                </div>
            `;
            console.error('Error:', error);
        }
    });
}); 