import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from "./SIPCalculator.module.css";

const SIPCalculator = () => {
    const [sipData, setSipData] = useState({
        monthlyInvestment: "",
        expectedReturn: "",
        timePeriod: "",
        timePeriodType: "years",
    });

    const [sipResult, setSipResult] = useState(null);

    const handleSipChange = (e) => {
        setSipData({
            ...sipData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateSIP = (e) => {
        e.preventDefault();
        const monthlyInvestment = parseFloat(sipData.monthlyInvestment);
        const annualReturn = parseFloat(sipData.expectedReturn) / 100;
        let timePeriod = parseFloat(sipData.timePeriod);

        if (sipData.timePeriodType === "years") {
            timePeriod = timePeriod * 12; // Convert to months
        }

        const monthlyReturn = annualReturn / 12;
        const totalMonths = timePeriod;

        if (monthlyInvestment && annualReturn && timePeriod) {
            // Future Value Formula: P * (( (1+i)^n - 1 ) / i) * (1+i)
            const futureValue = monthlyInvestment *
                ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) *
                (1 + monthlyReturn);

            const totalInvestment = monthlyInvestment * totalMonths;
            const wealthGained = futureValue - totalInvestment;

            // Generate Yearly Data for Bar Chart
            const yearlyData = [];
            const effectiveTenureInYears = (sipData.timePeriodType === "years")
                ? parseFloat(sipData.timePeriod)
                : Math.ceil(parseFloat(sipData.timePeriod) / 12);

            for (let i = 1; i <= effectiveTenureInYears; i++) {
                const monthsPassed = i * 12;
                // Calculate FV for this specific duration (approximate if user select months that don't align perfectly with years, but for chart 'Year X' markers we use 12, 24, etc.)
                // Current FV = P * [ (1+i)^n - 1 ] * (1+i) / i
                const currentFV = monthlyInvestment *
                    ((Math.pow(1 + monthlyReturn, monthsPassed) - 1) / monthlyReturn) *
                    (1 + monthlyReturn);

                yearlyData.push({
                    name: `Year ${i}`,
                    value: Math.round(currentFV),
                    label: `Year ${i}`
                });
            }

            setSipResult({
                totalInvestment,
                wealthGained,
                futureValue,
                yearlyData
            });
        }
    };

    const resetCalculator = () => {
        setSipData({
            monthlyInvestment: "",
            expectedReturn: "",
            timePeriod: "",
            timePeriodType: "years",
        });
        setSipResult(null);
    };

    return (
        <div className={styles.container}>

            {/* 1. Title Section */}
            <h2 className={styles.sectionTitle}>SIP CALCULATOR</h2>

            {/* 2. Calculator Layout (Split) */}
            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Left Side: Form */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>SIP Calculation</h3>
                                <p className={styles.boxSubtitle}>Enter your investment details to calculate returns</p>

                                <Form onSubmit={calculateSIP}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Monthly Investment (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="monthlyInvestment"
                                            value={sipData.monthlyInvestment}
                                            onChange={handleSipChange}
                                            placeholder="Enter monthly amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Amount you want to invest monthly</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Expected Annual Return (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="expectedReturn"
                                            value={sipData.expectedReturn}
                                            onChange={handleSipChange}
                                            placeholder="Enter expected rate"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Annual expected return rate</Form.Text>
                                    </div>

                                    <div className={styles.rowGroup}>
                                        <div style={{ flex: 1 }}>
                                            <Form.Label className={styles.label}>Time Period</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="timePeriod"
                                                value={sipData.timePeriod}
                                                onChange={handleSipChange}
                                                placeholder="Enter duration"
                                                className={styles.input}
                                            />
                                        </div>
                                        <div style={{ width: '100px', marginLeft: '10px' }}>
                                            <Form.Label className={`${styles.label} text-end d-block`}>Period</Form.Label>
                                            <Form.Select
                                                name="timePeriodType"
                                                value={sipData.timePeriodType}
                                                onChange={handleSipChange}
                                                className={styles.input}
                                            >
                                                <option value="years">Years</option>
                                                <option value="months">Months</option>
                                            </Form.Select>
                                        </div>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate Returns</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Right Side: Info / Result */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {sipResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>SIP Results</h3>
                                        <div className={styles.resultRow}>
                                            <span>Invested Amount:</span>
                                            <strong>₹{Math.round(sipResult.totalInvestment).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Wealth Gained:</span>
                                            <strong>₹{Math.round(sipResult.wealthGained).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span>Future Value:</span>
                                            <strong>₹{Math.round(sipResult.futureValue).toLocaleString()}</strong>
                                        </div>

                                        {/* Charts Section */}
                                        <div style={{ marginTop: '30px' }}>
                                            <h5 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#182724' }}>
                                                Investment Breakdown
                                            </h5>

                                            {/* Pie Chart */}
                                            <div style={{ width: '100%', height: '250px', marginBottom: '20px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Invested', value: Math.round(sipResult.totalInvestment) },
                                                                { name: 'Wealth Gained', value: Math.round(sipResult.wealthGained) }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            <Cell key="cell-0" fill="#182724" />
                                                            <Cell key="cell-1" fill="#14B8A6" />
                                                        </Pie>
                                                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Bar Chart - Yearly Growth */}
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                                                    Yearly Future Value
                                                </h5>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={sipResult.yearlyData}
                                                        margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                                                        barCategoryGap="20%"
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e0e0e0" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            interval="preserveStartEnd"
                                                        />
                                                        <YAxis
                                                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                        />
                                                        <Tooltip
                                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Future Value"]}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Legend verticalAlign="top" />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Yearly Future Value"
                                                            fill="#14B8A6"
                                                            radius={[6, 6, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Enter SIP Details</h4>
                                        <p className={styles.placeholderText}>Fill in the form to see your investment growth projections and analysis</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-chart-line me-2"></i> Growth Projections
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-coins me-2"></i> Wealth Accumulation
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-bolt me-2"></i> Instant Results
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* 3. About Section */}
            <div className={styles.aboutSection}>
                <Container>
                    <div className={styles.aboutHeader}>
                        <h3>About Systematic Investment Plan (SIP)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            SIP is an investment method offered by mutual funds where you can invest a fixed amount regularly instead of making a lump-sum investment. It helps you build wealth over time through the power of compounding.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-chart-column"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Rupee Cost Averaging</h5>
                                        <p className={styles.articleDesc}>Buy more units when prices are low and fewer when prices are high, averaging out your cost.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-rocket"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Power of Compounding</h5>
                                        <p className={styles.articleDesc}>Earn returns on your returns over time, leading to exponential growth of your wealth.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-clock"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Disciplined Investing</h5>
                                        <p className={styles.articleDesc}>Instills financial discipline by encouraging regular investments regardless of market conditions.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-hand-holding-dollar"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Flexibility</h5>
                                        <p className={styles.articleDesc}>Start with a small amount (like ₹500) and increase it as your income grows.</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </div>

        </div>
    );
};

export default SIPCalculator;
