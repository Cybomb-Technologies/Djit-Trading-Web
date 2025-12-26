import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import styles from "./FDCalculator.module.css";

const FDCalculator = () => {
    const [fdData, setFdData] = useState({
        principal: "",
        interestRate: "",
        tenure: "",
        tenureType: "years",
        compounding: "yearly",
    });

    const [fdResult, setFdResult] = useState(null);

    const handleFdChange = (e) => {
        setFdData({
            ...fdData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateFD = (e) => {
        e.preventDefault();
        const principal = parseFloat(fdData.principal);
        const annualRate = parseFloat(fdData.interestRate) / 100;
        let tenure = parseFloat(fdData.tenure);

        if (fdData.tenureType === "months") {
            tenure = tenure / 12;
        }

        let n;
        switch (fdData.compounding) {
            case "yearly": n = 1; break;
            case "half-yearly": n = 2; break;
            case "quarterly": n = 4; break;
            case "monthly": n = 12; break;
            default: n = 1;
        }

        if (principal && annualRate && tenure) {
            const amount = principal * Math.pow(1 + annualRate / n, n * tenure);
            const interestEarned = amount - principal;
            setFdResult({
                maturityAmount: amount,
                interestEarned,
                totalInvestment: principal,
            });
        }
    };

    const resetCalculator = () => {
        setFdData({ principal: "", interestRate: "", tenure: "", tenureType: "years", compounding: "yearly" });
        setFdResult(null);
    };

    return (
        <div className={styles.container}>

            {/* 1. Title Section */}
            <h2 className={styles.sectionTitle}>FD CALCULATOR</h2>

            {/* 2. Calculator Layout (Split) */}
            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Left Side: Form */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>FD Calculation</h3>
                                <p className={styles.boxSubtitle}>Enter your deposit details to calculate returns</p>

                                <Form onSubmit={calculateFD}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Principal Amount (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="principal"
                                            value={fdData.principal}
                                            onChange={handleFdChange}
                                            placeholder="Enter principal amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Enter the amount you want to deposit</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Annual Interest Rate (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="interestRate"
                                            value={fdData.interestRate}
                                            onChange={handleFdChange}
                                            placeholder="Enter interest rate"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Annual interest rate offered by the bank</Form.Text>
                                    </div>

                                    <div className={styles.rowGroup}>
                                        <div style={{ flex: 1 }}>
                                            <Form.Label className={styles.label}>Tenure</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="tenure"
                                                value={fdData.tenure}
                                                onChange={handleFdChange}
                                                placeholder="Enter tenure"
                                                className={styles.input}
                                            />
                                        </div>
                                        <div style={{ width: '100px', marginLeft: '10px' }}>
                                            <Form.Label className={`${styles.label} text-end d-block`}>Period</Form.Label>
                                            <Form.Select
                                                name="tenureType"
                                                value={fdData.tenureType}
                                                onChange={handleFdChange}
                                                className={styles.input}
                                            >
                                                <option value="years">Years</option>
                                                <option value="months">Months</option>
                                            </Form.Select>
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Compounding Frequency</Form.Label>
                                        <Form.Select
                                            name="compounding"
                                            value={fdData.compounding}
                                            onChange={handleFdChange}
                                            className={styles.input}
                                        >
                                            <option value="yearly">Yearly</option>
                                            <option value="half-yearly">Half-Yearly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="monthly">Monthly</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>How often interest is compounded</Form.Text>
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
                                {fdResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Result</h3>
                                        <div className={styles.resultRow}>
                                            <span>Invested Amount:</span>
                                            <strong>₹{(+fdResult.totalInvestment).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Total Interest:</span>
                                            <strong>₹{Math.round(fdResult.interestEarned).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span>Maturity Value:</span>
                                            <strong>₹{Math.round(fdResult.maturityAmount).toLocaleString()}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Enter FD Details</h4>
                                        <p className={styles.placeholderText}>Fill in the form to see your fixed deposit maturity amount and interest earnings</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-coins me-2"></i> Accurate Calculations
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-chart-line me-2"></i> Interest Projections
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
                        <h3>About Fixed Deposits (FD)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            A Fixed Deposit (FD) is a financial instrument provided by banks and NBFCs which offers investors a higher rate of interest than a regular savings account, until the given maturity date.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-shield-alt"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Safety & Security</h5>
                                        <p className={styles.articleDesc}>FDs are considered one of the safest investment options with guaranteed returns</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-chart-simple"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Fixed Returns</h5>
                                        <p className={styles.articleDesc}>Offers predictable, fixed returns that are not market-linked</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-bolt"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Flexible Tenure</h5>
                                        <p className={styles.articleDesc}>Choose tenure from 7 days to 10 years as per your financial goals</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-building-columns"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Loan Facility</h5>
                                        <p className={styles.articleDesc}>Can avail loans against FDs up to 75-90% of the deposit value</p>
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

export default FDCalculator;
