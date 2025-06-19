// DOM Elements
const vehiclePriceSlider = document.getElementById('vehiclePrice');
const priceValue = document.getElementById('priceValue');
const depositAmount = document.getElementById('depositAmount');
const loanTerm = document.getElementById('loanTerm');
const interestRate = document.getElementById('interestRate');
const monthlyPayment = document.getElementById('monthlyPayment');
const balanceChart = document.getElementById('balanceChart');
const hasBalloonPayment = document.getElementById('hasBalloonPayment');
const balloonPaymentGroup = document.getElementById('balloonPaymentGroup');
const balloonPaymentPercentage = document.getElementById('balloonPaymentPercentage');
const balloonPercentageValue = document.getElementById('balloonPercentageValue');
const balloonAmountDisplay = document.getElementById('balloonAmountDisplay');

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
    hasBalloonPayment.addEventListener('change', toggleBalloonPayment);
    balloonPaymentPercentage.addEventListener('input', updateBalloonDisplay);
    balloonPaymentPercentage.addEventListener('input', calculateLoan);
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

// Toggle balloon payment field visibility
function toggleBalloonPayment() {
    if (hasBalloonPayment.checked) {
        balloonPaymentGroup.style.display = 'flex';
        balloonPaymentGroup.classList.add('show');
        updateBalloonDisplay();
    } else {
        balloonPaymentGroup.classList.remove('show');
        setTimeout(() => {
            if (!hasBalloonPayment.checked) {
                balloonPaymentGroup.style.display = 'none';
            }
        }, 300);
        balloonPaymentPercentage.value = '15';
    }
    calculateLoan();
}

// Update balloon payment percentage display
function updateBalloonDisplay() {
    const percentage = parseInt(balloonPaymentPercentage.value);
    const vehiclePrice = parseFloat(vehiclePriceSlider.value) || 0;
    const deposit = parseFloat(depositAmount.value) || 0;
    const loanAmount = Math.max(0, vehiclePrice - deposit);
    const balloonAmount = (loanAmount * percentage) / 100;
    
    balloonPercentageValue.textContent = percentage;
    balloonAmountDisplay.textContent = `($${formatCurrency(balloonAmount)})`;
}

// Main loan calculation function
function calculateLoan() {
    const vehiclePrice = parseFloat(vehiclePriceSlider.value) || 0;
    const deposit = parseFloat(depositAmount.value) || 0;
    const termMonths = parseInt(loanTerm.value) || 12;
    const annualRate = parseFloat(interestRate.value) || 5;
    
    // Calculate loan amount
    const loanAmount = Math.max(0, vehiclePrice - deposit);
    
    // Calculate balloon amount from percentage
    const balloonPercentage = hasBalloonPayment.checked ? (parseInt(balloonPaymentPercentage.value) || 15) : 0;
    const balloonAmount = hasBalloonPayment.checked ? (loanAmount * balloonPercentage) / 100 : 0;
    
    // Update balloon display if balloon payment is enabled
    if (hasBalloonPayment.checked) {
        updateBalloonDisplay();
    }
    
    if (loanAmount === 0) {
        monthlyPayment.textContent = '$0.00';
        drawChart([]);
        return;
    }
    
    // Calculate monthly interest rate
    const monthlyRate = annualRate / 100 / 12;
    
    // Calculate monthly payment
    let monthly = 0;
    
    if (balloonAmount > 0) {
        // Calculate monthly payment with balloon payment
        if (monthlyRate > 0) {
            const presentValueOfBalloon = balloonAmount / Math.pow(1 + monthlyRate, termMonths);
            const amortizingAmount = loanAmount - presentValueOfBalloon;
            
            if (amortizingAmount > 0) {
                monthly = amortizingAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                         (Math.pow(1 + monthlyRate, termMonths) - 1);
            }
            

        } else {
            monthly = (loanAmount - balloonAmount) / termMonths;
            totalInterestAmount = 0;
        }
    } else {
        // Standard loan calculation without balloon payment
        if (monthlyRate > 0) {
            monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                     (Math.pow(1 + monthlyRate, termMonths) - 1);
        } else {
            monthly = loanAmount / termMonths;
        }

    }
    
    // Update display
    monthlyPayment.textContent = '$' + monthly.toFixed(2);
    
    // Generate amortization schedule for chart
    const schedule = generateAmortizationSchedule(loanAmount, monthlyRate, monthly, termMonths, balloonAmount);
    drawChart(schedule);
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, monthlyRate, monthlyPayment, termMonths, balloonAmount = 0) {
    const schedule = [];
    let remainingBalance = principal;
    
    for (let month = 0; month <= termMonths; month++) {
        if (month === 0) {
            schedule.push({ month: 0, balance: principal });
            continue;
        }
        
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = monthlyPayment - interestPayment;
        
        // Handle balloon payment on the last month
        if (month === termMonths && balloonAmount > 0) {
            principalPayment += balloonAmount;
        }
        
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
