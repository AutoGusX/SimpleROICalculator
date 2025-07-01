// ROI Calculator JavaScript
class ROICalculator {
    constructor() {
        this.data = {
            benefits: {
                rock1: { people: 50, hours: 2, rate: 50, improvement: 80, description: '' },
                rock2: { people: 25, hours: 3, rate: 75, improvement: 60, description: '' },
                rock3: { people: 50, hours: 25000, improvement: 20, description: '' }
            },
            investment: {
                software: [120000, 150000, 150000, 180000, 180000],
                training: [50000, 25000, 25000, 30000, 30000],
                implementation: [80000, 20000, 10000, 15000, 15000]
            },
            assumptions: {
                discountRate: 10,
                growthRate: 3,
                rampUp: [25, 50, 75, 90, 100]
            }
        };
        
        this.charts = {
            cashFlow: null,
            annual: null
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSliderUpdates();
        this.calculate();
        this.updateCharts();
    }

    setupEventListeners() {
        // Benefits inputs
        ['rock1', 'rock2'].forEach(rock => {
            ['people', 'hours', 'rate', 'improvement', 'description'].forEach(field => {
                const input = document.getElementById(`${rock}-${field}`);
                if (input) {
                    input.addEventListener('input', () => this.updateBenefits());
                }
            });
        });

        // Rock3 has different fields (no rate)
        ['people', 'hours', 'improvement', 'description'].forEach(field => {
            const input = document.getElementById(`rock3-${field}`);
            if (input) {
                input.addEventListener('input', () => this.updateBenefits());
            }
        });

        // Investment inputs
        ['software', 'training', 'implementation'].forEach(category => {
            for (let i = 1; i <= 5; i++) {
                const input = document.getElementById(`${category}-y${i}`);
                if (input) {
                    input.addEventListener('input', () => this.updateInvestment());
                }
            }
        });

        // Assumptions inputs
        const discountRate = document.getElementById('discount-rate');
        const growthRate = document.getElementById('growth-rate');
        
        if (discountRate) discountRate.addEventListener('input', () => this.updateAssumptions());
        if (growthRate) growthRate.addEventListener('input', () => this.updateAssumptions());

        // Ramp-up inputs
        for (let i = 1; i <= 5; i++) {
            const input = document.getElementById(`ramp-y${i}`);
            if (input) {
                input.addEventListener('input', () => this.updateRampUp());
            }
        }

        // Export buttons
        const printBtn = document.getElementById('print-pdf');
        const saveBtn = document.getElementById('save-calculation');
        const loadBtn = document.getElementById('load-calculation');

        if (printBtn) printBtn.addEventListener('click', () => this.exportPDF());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCalculation());
        if (loadBtn) loadBtn.addEventListener('click', () => this.loadCalculation());
    }

    setupSliderUpdates() {
        // Update slider value displays
        ['rock1', 'rock2', 'rock3'].forEach(rock => {
            const slider = document.getElementById(`${rock}-improvement`);
            const display = slider?.nextElementSibling;
            if (slider && display) {
                slider.addEventListener('input', () => {
                    display.textContent = `${slider.value}%`;
                });
            }
        });

        // Ramp-up sliders
        for (let i = 1; i <= 5; i++) {
            const slider = document.getElementById(`ramp-y${i}`);
            const display = slider?.nextElementSibling;
            if (slider && display) {
                slider.addEventListener('input', () => {
                    display.textContent = `${slider.value}%`;
                });
            }
        }
    }

    updateBenefits() {
        // Handle rock1 and rock2 (with rate)
        ['rock1', 'rock2'].forEach(rock => {
            const people = parseFloat(document.getElementById(`${rock}-people`)?.value || 0);
            const hours = parseFloat(document.getElementById(`${rock}-hours`)?.value || 0);
            const rate = parseFloat(document.getElementById(`${rock}-rate`)?.value || 0);
            const improvement = parseFloat(document.getElementById(`${rock}-improvement`)?.value || 0);
            const description = document.getElementById(`${rock}-description`)?.value || '';

            this.data.benefits[rock] = { people, hours, rate, improvement, description };
        });

        // Handle rock3 (without rate)
        const rock3People = parseFloat(document.getElementById('rock3-people')?.value || 0);
        const rock3Hours = parseFloat(document.getElementById('rock3-hours')?.value || 0);
        const rock3Improvement = parseFloat(document.getElementById('rock3-improvement')?.value || 0);
        const rock3Description = document.getElementById('rock3-description')?.value || '';

        this.data.benefits.rock3 = { people: rock3People, hours: rock3Hours, improvement: rock3Improvement, description: rock3Description };
        
        this.calculate();
        this.updateCharts();
    }

    updateInvestment() {
        ['software', 'training', 'implementation'].forEach(category => {
            const values = [];
            for (let i = 1; i <= 5; i++) {
                const value = parseFloat(document.getElementById(`${category}-y${i}`)?.value || 0);
                values.push(value);
            }
            this.data.investment[category] = values;
        });
        
        this.calculate();
        this.updateCharts();
    }

    updateAssumptions() {
        const discountRate = parseFloat(document.getElementById('discount-rate')?.value || 10);
        const growthRate = parseFloat(document.getElementById('growth-rate')?.value || 3);
        
        this.data.assumptions.discountRate = discountRate;
        this.data.assumptions.growthRate = growthRate;
        
        this.calculate();
        this.updateCharts();
    }

    updateRampUp() {
        const rampUp = [];
        for (let i = 1; i <= 5; i++) {
            const value = parseFloat(document.getElementById(`ramp-y${i}`)?.value || 0);
            rampUp.push(value);
        }
        this.data.assumptions.rampUp = rampUp;
        
        this.calculate();
        this.updateCharts();
    }

    calculateBenefits() {
        const benefits = {};
        let totalAnnualBenefit = 0;

        // Handle rock1 and rock2 (time savings)
        ['rock1', 'rock2'].forEach(rock => {
            const { people, hours, rate, improvement } = this.data.benefits[rock];
            const annualBenefit = people * hours * rate * 52 * (improvement / 100);
            benefits[rock] = annualBenefit;
            totalAnnualBenefit += annualBenefit;

            // Update display
            const display = document.getElementById(`${rock}-benefit`);
            if (display) {
                display.textContent = this.formatCurrency(annualBenefit);
            }
        });

        // Handle rock3 (project/product growth)
        const { people: currentProjects, hours: avgRevenue, improvement } = this.data.benefits.rock3;
        const additionalProjects = Math.round(currentProjects * (improvement / 100));
        const rock3AnnualBenefit = additionalProjects * avgRevenue;
        
        benefits.rock3 = rock3AnnualBenefit;
        totalAnnualBenefit += rock3AnnualBenefit;

        // Update rock3 displays
        const rock3BenefitDisplay = document.getElementById('rock3-benefit');
        const rock3CountDisplay = document.getElementById('rock3-additional-count');
        
        if (rock3BenefitDisplay) {
            rock3BenefitDisplay.textContent = this.formatCurrency(rock3AnnualBenefit);
        }
        if (rock3CountDisplay) {
            rock3CountDisplay.textContent = additionalProjects.toString();
        }

        // Update total benefits display
        const totalDisplay = document.getElementById('total-benefits');
        if (totalDisplay) {
            totalDisplay.textContent = this.formatCurrency(totalAnnualBenefit);
        }

        return { benefits, totalAnnualBenefit };
    }

    calculateInvestment() {
        const { software, training, implementation } = this.data.investment;
        const totalInvestment = [];
        let total5Year = 0;

        for (let i = 0; i < 5; i++) {
            const yearTotal = software[i] + training[i] + implementation[i];
            totalInvestment.push(yearTotal);
            total5Year += yearTotal;
        }

        // Update total investment display
        const totalDisplay = document.getElementById('total-investment');
        if (totalDisplay) {
            totalDisplay.textContent = this.formatCurrency(total5Year);
        }

        return { totalInvestment, total5Year };
    }

    calculateROIMetrics() {
        const { totalAnnualBenefit } = this.calculateBenefits();
        const { totalInvestment } = this.calculateInvestment();
        const { discountRate, growthRate, rampUp } = this.data.assumptions;

        // Calculate year-by-year benefits with ramp-up and growth
        const yearlyBenefits = [];
        const yearlyCosts = totalInvestment;
        const cumulativeCashFlow = [];
        
        let cumulativeFlow = 0;
        let paybackPeriod = null;

        for (let i = 0; i < 5; i++) {
            // Apply ramp-up and growth
            const rampFactor = rampUp[i] / 100;
            const growthFactor = Math.pow(1 + growthRate / 100, i);
            const yearBenefit = totalAnnualBenefit * rampFactor * growthFactor;
            
            yearlyBenefits.push(yearBenefit);
            
            // Calculate cumulative cash flow
            cumulativeFlow += yearBenefit - yearlyCosts[i];
            cumulativeCashFlow.push(cumulativeFlow);
            
            // Find payback period
            if (paybackPeriod === null && cumulativeFlow > 0) {
                paybackPeriod = i + 1 - (cumulativeFlow - (yearBenefit - yearlyCosts[i])) / (yearBenefit - yearlyCosts[i]);
            }
        }

        // Calculate NPV
        let npv = 0;
        for (let i = 0; i < 5; i++) {
            const discountFactor = Math.pow(1 + discountRate / 100, i + 1);
            npv += (yearlyBenefits[i] - yearlyCosts[i]) / discountFactor;
        }

        // Calculate IRR (approximation using Newton-Raphson method)
        const irr = this.calculateIRR(yearlyBenefits, yearlyCosts);

        // Calculate 5-year ROI
        const totalBenefits = yearlyBenefits.reduce((sum, benefit) => sum + benefit, 0);
        const totalCosts = yearlyCosts.reduce((sum, cost) => sum + cost, 0);
        const roi = ((totalBenefits - totalCosts) / totalCosts) * 100;

        // Calculate cost of inaction (5-year lost benefits)
        const costOfInaction = totalBenefits;

        // Calculate 3-month delay cost
        const delayMonths = 3;
        const quarterlyBenefit = (totalAnnualBenefit * rampUp[0] / 100) / 4;
        const threeMonthDelayCost = quarterlyBenefit;

        return {
            roi,
            paybackPeriod: paybackPeriod || 'N/A',
            npv,
            irr,
            costOfInaction,
            threeMonthDelayCost,
            yearlyBenefits,
            yearlyCosts,
            cumulativeCashFlow
        };
    }

    calculateIRR(benefits, costs) {
        // Calculate net cash flows
        const cashFlows = [];
        for (let i = 0; i < 5; i++) {
            cashFlows.push(benefits[i] - costs[i]);
        }
        
        // Add initial investment as negative cash flow at t=0
        const initialInvestment = costs[0] > 0 ? -costs[0] : 0;
        const netCashFlows = [initialInvestment, ...cashFlows];
        
        // Check for edge cases
        if (this.hasInvalidCashFlows(netCashFlows)) {
            return this.estimateSimpleROI(benefits, costs);
        }
        
        // Try Newton-Raphson method first
        let irr = this.calculateIRRNewtonRaphson(netCashFlows);
        
        // If Newton-Raphson fails, use Bisection method
        if (irr === null || isNaN(irr) || irr < -0.99 || irr > 10) {
            irr = this.calculateIRRBisection(netCashFlows);
        }
        
        // Final validation and fallback
        if (irr === null || isNaN(irr)) {
            return this.estimateSimpleROI(benefits, costs);
        }
        
        return Math.max(0, Math.min(1000, irr * 100)); // Cap between 0% and 1000%
    }
    
    hasInvalidCashFlows(cashFlows) {
        // Check if all cash flows are zero or same sign
        const nonZeroFlows = cashFlows.filter(cf => Math.abs(cf) > 0.01);
        if (nonZeroFlows.length < 2) return true;
        
        const positiveFlows = nonZeroFlows.filter(cf => cf > 0).length;
        const negativeFlows = nonZeroFlows.filter(cf => cf < 0).length;
        
        // Need at least one positive and one negative flow for meaningful IRR
        return positiveFlows === 0 || negativeFlows === 0;
    }
    
    calculateIRRNewtonRaphson(cashFlows) {
        // Better initial guess based on cash flow analysis
        let irr = this.getInitialIRRGuess(cashFlows);
        const tolerance = 0.00001;
        const maxIterations = 100;
        
        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let derivativeNpv = 0;
            
            // Calculate NPV and its derivative
            for (let j = 0; j < cashFlows.length; j++) {
                const factor = Math.pow(1 + irr, j);
                npv += cashFlows[j] / factor;
                
                if (j > 0) {
                    derivativeNpv -= j * cashFlows[j] / (factor * (1 + irr));
                }
            }
            
            // Check convergence
            if (Math.abs(npv) < tolerance) {
                return irr;
            }
            
            // Check for derivative too small (avoid division by zero)
            if (Math.abs(derivativeNpv) < 1e-10) {
                break;
            }
            
            // Newton-Raphson step
            const newIRR = irr - npv / derivativeNpv;
            
            // Bound the step to prevent wild oscillations
            const maxStep = 0.5;
            const step = Math.max(-maxStep, Math.min(maxStep, newIRR - irr));
            irr += step;
            
            // Keep IRR in reasonable bounds
            irr = Math.max(-0.99, Math.min(10, irr));
        }
        
        return irr;
    }
    
    calculateIRRBisection(cashFlows) {
        let lowerBound = -0.99;
        let upperBound = 5.0;
        const tolerance = 0.0001;
        const maxIterations = 100;
        
        // Check if bounds are valid
        const npvLower = this.calculateNPV(cashFlows, lowerBound);
        const npvUpper = this.calculateNPV(cashFlows, upperBound);
        
        // If same sign, try wider bounds
        if (npvLower * npvUpper > 0) {
            lowerBound = -0.95;
            upperBound = 10.0;
            
            const npvLower2 = this.calculateNPV(cashFlows, lowerBound);
            const npvUpper2 = this.calculateNPV(cashFlows, upperBound);
            
            if (npvLower2 * npvUpper2 > 0) {
                return null; // No solution found
            }
        }
        
        for (let i = 0; i < maxIterations; i++) {
            const midpoint = (lowerBound + upperBound) / 2;
            const npvMid = this.calculateNPV(cashFlows, midpoint);
            
            if (Math.abs(npvMid) < tolerance) {
                return midpoint;
            }
            
            const npvLow = this.calculateNPV(cashFlows, lowerBound);
            
            if (npvLow * npvMid < 0) {
                upperBound = midpoint;
            } else {
                lowerBound = midpoint;
            }
            
            if (Math.abs(upperBound - lowerBound) < tolerance) {
                return (lowerBound + upperBound) / 2;
            }
        }
        
        return (lowerBound + upperBound) / 2;
    }
    
    calculateNPV(cashFlows, rate) {
        let npv = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            npv += cashFlows[i] / Math.pow(1 + rate, i);
        }
        return npv;
    }
    
    getInitialIRRGuess(cashFlows) {
        // Calculate a rough approximation based on average returns
        const totalInflows = cashFlows.slice(1).reduce((sum, cf) => sum + Math.max(0, cf), 0);
        const totalOutflows = Math.abs(cashFlows[0]) + cashFlows.slice(1).reduce((sum, cf) => sum + Math.abs(Math.min(0, cf)), 0);
        
        if (totalOutflows === 0) return 0;
        
        const years = cashFlows.length - 1;
        const simpleReturn = (totalInflows / totalOutflows) - 1;
        
        // Annualize the return
        const annualizedReturn = Math.pow(1 + simpleReturn, 1 / years) - 1;
        
        // Bound the initial guess
        return Math.max(-0.5, Math.min(2.0, annualizedReturn));
    }
    
    estimateSimpleROI(benefits, costs) {
        // Fallback: calculate simple annualized ROI
        const totalBenefits = benefits.reduce((sum, benefit) => sum + benefit, 0);
        const totalCosts = costs.reduce((sum, cost) => sum + cost, 0);
        
        if (totalCosts === 0) return 0;
        
        const simpleROI = (totalBenefits - totalCosts) / totalCosts;
        const years = 5;
        
        // Convert to annualized rate
        const annualizedROI = Math.pow(1 + simpleROI, 1 / years) - 1;
        
        return Math.max(0, Math.min(2.0, annualizedROI)) * 100;
    }

    calculate() {
        this.calculateBenefits();
        this.calculateInvestment();
        
        const metrics = this.calculateROIMetrics();
        this.updateMetricsDisplay(metrics);
        
        return metrics;
    }

    updateMetricsDisplay(metrics) {
        const elements = {
            'roi-percentage': `${metrics.roi.toFixed(1)}%`,
            'payback-period': typeof metrics.paybackPeriod === 'number' ? 
                `${metrics.paybackPeriod.toFixed(1)} years` : metrics.paybackPeriod,
            'npv': this.formatCurrency(metrics.npv),
            'irr': `${metrics.irr.toFixed(1)}%`,
            'cost-inaction': this.formatCurrency(metrics.costOfInaction),
            'delay-cost': this.formatCurrency(metrics.threeMonthDelayCost)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update PDF content
        const pdfElements = {
            'pdf-roi': elements['roi-percentage'],
            'pdf-payback': elements['payback-period'],
            'pdf-npv': elements['npv'],
            'pdf-irr': elements['irr']
        };

        Object.entries(pdfElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateCharts() {
        const metrics = this.calculate();
        
        // Destroy existing charts
        if (this.charts.cashFlow) {
            this.charts.cashFlow.destroy();
        }
        if (this.charts.annual) {
            this.charts.annual.destroy();
        }

        // Create new charts
        this.createCashFlowChart(metrics);
        this.createAnnualChart(metrics);
    }

    createCashFlowChart(metrics) {
        const ctx = document.getElementById('cashFlowChart');
        if (!ctx) return;

        const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
        
        this.charts.cashFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Cumulative Cash Flow',
                    data: metrics.cumulativeCashFlow,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Cash Flow: ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    createAnnualChart(metrics) {
        const ctx = document.getElementById('annualChart');
        if (!ctx) return;

        const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
        
        this.charts.annual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Benefits',
                    data: metrics.yearlyBenefits,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }, {
                    label: 'Costs',
                    data: metrics.yearlyCosts,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    async exportPDF() {
        try {
            // Update PDF date
            const dateElement = document.querySelector('.pdf-date');
            if (dateElement) {
                dateElement.textContent = new Date().toLocaleDateString();
            }

            // Use html2canvas and jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add title and header
            pdf.setFontSize(24);
            pdf.setTextColor(102, 126, 234);
            pdf.text('SaaS ROI Analysis Report', 20, 30);
            
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(new Date().toLocaleDateString(), 20, 40);
            
            // Add metrics
            const metrics = this.calculate();
            let yPos = 60;
            
            pdf.setFontSize(14);
            pdf.setTextColor(51, 51, 51);
            
            const metricsData = [
                ['5-Year ROI', `${metrics.roi.toFixed(1)}%`],
                ['Payback Period', typeof metrics.paybackPeriod === 'number' ? 
                    `${metrics.paybackPeriod.toFixed(1)} years` : metrics.paybackPeriod],
                ['Net Present Value', this.formatCurrency(metrics.npv)],
                ['Internal Rate of Return', `${metrics.irr.toFixed(1)}%`],
                ['Cost of Inaction (5yr)', this.formatCurrency(metrics.costOfInaction)],
                ['3-Month Delay Cost', this.formatCurrency(metrics.threeMonthDelayCost)]
            ];
            
            metricsData.forEach(([label, value], index) => {
                const yPosition = yPos + (index * 15);
                pdf.text(label + ':', 20, yPosition);
                pdf.setTextColor(102, 126, 234);
                pdf.text(value, 100, yPosition);
                pdf.setTextColor(51, 51, 51);
            });
            
            // Add Big Rocks descriptions
            yPos += 120;
            pdf.setFontSize(16);
            pdf.text('Benefit Areas', 20, yPos);
            
            yPos += 15;
            pdf.setFontSize(10);
            
            ['rock1', 'rock2', 'rock3'].forEach((rock, index) => {
                const rockData = this.data.benefits[rock];
                if (rockData.description && rockData.description.trim()) {
                    const rockNames = ['Process Efficiency', 'Cost Reduction', 'Revenue Growth'];
                    pdf.setTextColor(102, 126, 234);
                    pdf.text(`${rockNames[index]}:`, 20, yPos);
                    pdf.setTextColor(51, 51, 51);
                    
                    // Add project count for rock3
                    if (rock === 'rock3') {
                        const additionalProjects = Math.round(rockData.people * (rockData.improvement / 100));
                        pdf.text(`(${additionalProjects} additional projects/products)`, 25, yPos + 5);
                        yPos += 5;
                    }
                    
                    // Split long descriptions into multiple lines
                    const lines = pdf.splitTextToSize(rockData.description, 160);
                    yPos += 5;
                    lines.forEach(line => {
                        pdf.text(line, 25, yPos);
                        yPos += 5;
                    });
                    yPos += 5;
                }
            });
            
            // Add summary table
            yPos += 10;
            pdf.setFontSize(16);
            pdf.setTextColor(51, 51, 51);
            pdf.text('5-Year Financial Summary', 20, yPos);
            
            yPos += 20;
            pdf.setFontSize(12);
            
            // Year headers
            const headers = ['Year', 'Benefits', 'Costs', 'Net Cash Flow'];
            headers.forEach((header, index) => {
                pdf.text(header, 20 + (index * 40), yPos);
            });
            
            yPos += 10;
            
            // Year data
            for (let i = 0; i < 5; i++) {
                const yearData = [
                    `${i + 1}`,
                    this.formatCurrency(metrics.yearlyBenefits[i], true),
                    this.formatCurrency(metrics.yearlyCosts[i], true),
                    this.formatCurrency(metrics.yearlyBenefits[i] - metrics.yearlyCosts[i], true)
                ];
                
                yearData.forEach((data, index) => {
                    pdf.text(data, 20 + (index * 40), yPos + (i * 8));
                });
            }
            
            // Save the PDF
            pdf.save('roi-analysis.pdf');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

    saveCalculation() {
        const data = {
            benefits: this.data.benefits,
            investment: this.data.investment,
            assumptions: this.data.assumptions,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `roi-calculation-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    loadCalculation() {
        const input = document.getElementById('file-input');
        if (!input) return;
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.loadDataToForm(data);
                    this.calculate();
                    this.updateCharts();
                } catch (error) {
                    alert('Error loading file. Please check the file format.');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    loadDataToForm(data) {
        // Load benefits data
        Object.entries(data.benefits).forEach(([rock, values]) => {
            Object.entries(values).forEach(([field, value]) => {
                const input = document.getElementById(`${rock}-${field}`);
                if (input) {
                    input.value = value;
                    // Update slider displays
                    if (field === 'improvement') {
                        const display = input.nextElementSibling;
                        if (display) display.textContent = `${value}%`;
                    }
                }
            });
        });

        // Load investment data
        Object.entries(data.investment).forEach(([category, values]) => {
            values.forEach((value, index) => {
                const input = document.getElementById(`${category}-y${index + 1}`);
                if (input) input.value = value;
            });
        });

        // Load assumptions data
        const discountInput = document.getElementById('discount-rate');
        const growthInput = document.getElementById('growth-rate');
        
        if (discountInput) discountInput.value = data.assumptions.discountRate;
        if (growthInput) growthInput.value = data.assumptions.growthRate;

        // Load ramp-up data
        data.assumptions.rampUp.forEach((value, index) => {
            const input = document.getElementById(`ramp-y${index + 1}`);
            if (input) {
                input.value = value;
                const display = input.nextElementSibling;
                if (display) display.textContent = `${value}%`;
            }
        });

        this.data = data;
    }

    formatCurrency(amount, short = false) {
        if (short && Math.abs(amount) >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        } else if (short && Math.abs(amount) >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'K';
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Global function for chart tooltips
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.roiCalculator = new ROICalculator();
});

// Handle print functionality
window.addEventListener('beforeprint', () => {
    const pdfContent = document.getElementById('pdf-content');
    if (pdfContent) {
        pdfContent.style.display = 'block';
    }
});

window.addEventListener('afterprint', () => {
    const pdfContent = document.getElementById('pdf-content');
    if (pdfContent) {
        pdfContent.style.display = 'none';
    }
}); 