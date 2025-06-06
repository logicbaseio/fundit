// DOM Elements
const vehiclePriceSlider = document.getElementById('vehiclePrice');
const priceValue = document.getElementById('priceValue');
const depositAmount = document.getElementById('depositAmount');
const loanTerm = document.getElementById('loanTerm');
const interestRate = document.getElementById('interestRate');
const monthlyPayment = document.getElementById('monthlyPayment');
const totalInterest = document.getElementById('totalInterest');
const balanceChart = document.getElementById('balanceChart');

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    updatePriceDisplay();
    calculateLoan();
    
    // Event listeners
    vehiclePriceSlider.addEventListener('input', updatePriceDisplay);
    vehiclePriceSlider.addEventListener('input', calculateLoan);
    depositAmount.addEventListener('input', calculateLoan);
    loanTerm.addEventListener('change', calculateLoan);
    interestRate.addEventListener('input', calculateLoan);
});

// Update price display with formatting
function updatePriceDisplay() {
    const price = parseInt(vehiclePriceSlider.value);
    priceValue.textContent = formatCurrency(price);
}

// Format currency without $ sign
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US').format(amount);
}

// Main loan calculation function
function calculateLoan() {
    const vehiclePrice = parseFloat(vehiclePriceSlider.value) || 0;
    const deposit = parseFloat(depositAmount.value) || 0;
    const termMonths = parseInt(loanTerm.value) || 12;
    const annualRate = parseFloat(interestRate.value) || 5;
    
    // Calculate loan amount
    const loanAmount = Math.max(0, vehiclePrice - deposit);
    
    if (loanAmount === 0) {
        monthlyPayment.textContent = '$0.00';
        if (totalInterest) {
            totalInterest.textContent = '$0.00';
        }
        drawChart([]);
        return;
    }
    
    // Calculate monthly interest rate
    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate monthly payment using loan formula
    let monthly = 0;
    if (monthlyRate > 0) {
        monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                 (Math.pow(1 + monthlyRate, termMonths) - 1);
    } else {
        monthly = loanAmount / termMonths;
    }
    
    // Calculate total interest
    const totalPayments = monthly * termMonths;
    const totalInterestAmount = totalPayments - loanAmount;
    
    // Update display
    monthlyPayment.textContent = '$' + monthly.toFixed(2);
    if (totalInterest) {
        totalInterest.textContent = '$' + totalInterestAmount.toFixed(2);
    }
    
    // Generate amortization schedule for chart
    const schedule = generateAmortizationSchedule(loanAmount, monthlyRate, monthly, termMonths);
    drawChart(schedule);
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, monthlyRate, monthlyPayment, termMonths) {
    const schedule = [];
    let remainingBalance = principal;
    
    for (let month = 0; month <= termMonths; month++) {
        if (month === 0) {
            schedule.push({ month: 0, balance: principal });
            continue;
        }
        
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        schedule.push({ month: month, balance: remainingBalance });
        
        if (remainingBalance <= 0) break;
    }
    
    return schedule;
}

// Draw the balance chart
function drawChart(schedule) {
    const canvas = balanceChart;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (schedule.length === 0) return;
    
    // Chart dimensions with better padding for labels
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max values for scaling
    const maxBalance = Math.max(...schedule.map(s => s.balance));
    const maxMonth = Math.max(...schedule.map(s => s.month));
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
        const x = padding + (i / 5) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw axes labels
    ctx.fillStyle = '#666';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels (months)
    for (let i = 0; i <= 5; i++) {
        const x = padding + (i / 5) * chartWidth;
        const month = Math.round((i / 5) * maxMonth);
        ctx.fillText(month.toString(), x, height - 20);
    }
    
    // Y-axis labels (balance)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * chartHeight + 4;
        const balance = maxBalance * (1 - i / 4);
        const label = balance >= 1000 ? '$' + (balance / 1000).toFixed(0) + 'K' : '$' + balance.toFixed(0);
        ctx.fillText(label, padding - 15, y);
    }
    
    // Draw the balance curve
    if (schedule.length > 1) {
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < schedule.length; i++) {
            const x = padding + (schedule[i].month / maxMonth) * chartWidth;
            const y = padding + (1 - schedule[i].balance / maxBalance) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Fill area under curve
        ctx.fillStyle = 'rgba(255, 153, 0, 0.1)';
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.closePath();
        ctx.fill();
    }
    
    // Add axis labels
    ctx.fillStyle = '#666';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Months', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Balance', 0, 0);
    ctx.restore();
}

// Handle window resize
window.addEventListener('resize', function() {
    setTimeout(calculateLoan, 100);
});