import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from "./RDCalculator.module.css";

const RDCalculator = () => {
    const [rdData, setRdData] = useState({
        monthlyInvestment: "",
        interestRate: "",
        tenure: "",
    });

    const [rdResult, setRdResult] = useState(null);

    const handleRdChange = (e) => {
        setRdData({
            ...rdData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateRD = (e) => {
        e.preventDefault();
        const principal = parseFloat(rdData.monthlyInvestment);
        const annualRate = parseFloat(rdData.interestRate); // %
        const tenureMonths = parseFloat(rdData.tenure);

        if (principal && annualRate && tenureMonths) {
            // RD Calculation with Quarterly Compounding (Standard in India)
            // or Simple approximate: I = P * n(n+1)/24 * r/100

            // Let's use the loop approach for Quarterly Compounding simulation which is more accurate for banks
            // Each installment 'P' is deposited at start of month.
            // But standard formula often used is A = P * (1+r/400)^(4n/3)?? No.

            // Using the Simple Interest approximation for ease and general acceptance in basic calculators:
            // Interest = P * (N * (N+1)) / 24 * (R / 100)

            const n = tenureMonths;
            const r = annualRate;

            const interestEarned = principal * (n * (n + 1)) / 24 * (r / 100);
            const totalInvestment = principal * n;
            const maturityAmount = totalInvestment + interestEarned;



            // Generate Yearly Data for Bar Chart (Growth)
            const yearlyData = [];
            const years = Math.ceil(n / 12);

            for (let i = 1; i <= years; i++) {
                const monthsPassed = Math.min(i * 12, n);
                // Calculate maturity at this point
                // Using simple interest approx for display consistency: I = P * N(N+1)/24 * R/100
                const currentN = monthsPassed;
                const currentInterest = principal * (currentN * (currentN + 1)) / 24 * (r / 100);
                const currentTotal = (principal * currentN) + currentInterest;

                yearlyData.push({
                    name: `Year ${i}`,
                    value: Math.round(currentTotal),
                    label: `Year ${i}`
                });
            }

            setRdResult({
                totalInvestment,
                interestEarned,
                maturityAmount,
                yearlyData
            });
        }
    };

    const resetCalculator = () => {
        setRdData({
            monthlyInvestment: "",
            interestRate: "",
            tenure: "",
        });
        setRdResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>RD CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>RD Calculation</h3>
                                <p className={styles.boxSubtitle}>Calculate returns on your Recurring Deposits</p>

                                <Form onSubmit={calculateRD}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Monthly Investment (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="monthlyInvestment"
                                            value={rdData.monthlyInvestment}
                                            onChange={handleRdChange}
                                            placeholder="Enter monthly deposit"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Amount you want to save every month</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Interest Rate (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="interestRate"
                                            value={rdData.interestRate}
                                            onChange={handleRdChange}
                                            placeholder="Enter interest rate"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Annual interest rate offered by bank</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Tenure (Months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="tenure"
                                            value={rdData.tenure}
                                            onChange={handleRdChange}
                                            placeholder="Enter months"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Total number of months</Form.Text>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate Returns</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Result Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {rdResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Result</h3>
                                        <div className={styles.resultRow}>
                                            <span>Total Investment:</span>
                                            <strong>₹{(+rdResult.totalInvestment).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Interest Earned:</span>
                                            <strong>₹{Math.round(rdResult.interestEarned).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span>Maturity Amount:</span>
                                            <strong>₹{Math.round(rdResult.maturityAmount).toLocaleString()}</strong>
                                        </div>

                                        {/* Charts Section */}
                                        <div style={{ marginTop: '30px' }}>
                                            <h5 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#182724' }}>
                                                Investment Analysis
                                            </h5>

                                            {/* Pie Chart */}
                                            <div style={{ width: '100%', height: '250px', marginBottom: '20px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Invested', value: Math.round(rdResult.totalInvestment) },
                                                                { name: 'Interest', value: Math.round(rdResult.interestEarned) }
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
                                                    Yearly Maturity Value
                                                </h5>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={rdResult.yearlyData}
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
                                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Maturity Value"]}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Legend verticalAlign="top" />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Maturity Value"
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
                                        <h4 className={styles.placeholderTitle}>Enter RD Details</h4>
                                        <p className={styles.placeholderText}>Fill in the form to see your RD maturity value</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-coins me-2"></i> Safe Savings
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-chart-line me-2"></i> Guaranteed Returns
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-piggy-bank me-2"></i> Disciplined Saving
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Container>
                    <div className={styles.aboutHeader}>
                        <h3>About Recurring Deposit (RD)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            Recurring Deposit is a special type of term deposit offered by banks which allows people with regular incomes to deposit a fixed amount every month into their Recurring Deposit account and earn interest at the rate applicable to Fixed Deposits.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-piggy-bank"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Small Savings</h5>
                                        <p className={styles.articleDesc}>Ideal for those who cannot deposit a large lump sum amount at once.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-calendar-check"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Fixed Tenure</h5>
                                        <p className={styles.articleDesc}>Tenure ranges from 6 months to 10 years.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-chart-line"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Interest Rates</h5>
                                        <p className={styles.articleDesc}>Interest rates are similar to that of Fixed Deposits.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-lock"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Liquidity</h5>
                                        <p className={styles.articleDesc}>Premature withdrawal is allowed subject to penalty and bank norms.</p>
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

export default RDCalculator;
