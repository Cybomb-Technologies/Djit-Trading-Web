import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
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

            setRdResult({
                totalInvestment,
                interestEarned,
                maturityAmount,
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
