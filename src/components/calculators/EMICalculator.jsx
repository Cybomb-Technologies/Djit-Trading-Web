import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import styles from "./EMICalculator.module.css";

const EMICalculator = () => {
    const [emiData, setEmiData] = useState({
        loanAmount: "",
        interestRate: "",
        tenure: "",
        tenureType: "years",
    });

    const [emiResult, setEmiResult] = useState(null);

    const handleEmiChange = (e) => {
        setEmiData({
            ...emiData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateEMI = (e) => {
        e.preventDefault();
        const principal = parseFloat(emiData.loanAmount);
        const annualRate = parseFloat(emiData.interestRate);
        let tenure = parseFloat(emiData.tenure);

        // Convert tenure to months
        let n = tenure;
        if (emiData.tenureType === "years") {
            n = tenure * 12;
        }

        // Monthly Interest Rate (r)
        const r = annualRate / 12 / 100;

        if (principal && annualRate && n) {
            // EMI Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
            const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

            const totalPayment = emi * n;
            const totalInterest = totalPayment - principal;

            setEmiResult({
                monthlyEMI: emi,
                totalInterest: totalInterest,
                totalPayment: totalPayment,
                principal: principal
            });
        }
    };

    const resetCalculator = () => {
        setEmiData({
            loanAmount: "",
            interestRate: "",
            tenure: "",
            tenureType: "years",
        });
        setEmiResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>EMI CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>EMI Calculation</h3>
                                <p className={styles.boxSubtitle}>Enter your loan details to calculate EMI</p>

                                <Form onSubmit={calculateEMI}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Loan Amount (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="loanAmount"
                                            value={emiData.loanAmount}
                                            onChange={handleEmiChange}
                                            placeholder="Enter loan amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Total principal loan amount</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Interest Rate (% P.A.)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="interestRate"
                                            value={emiData.interestRate}
                                            onChange={handleEmiChange}
                                            placeholder="Enter annual interest rate"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Annual interest rate required</Form.Text>
                                    </div>

                                    <div className={styles.rowGroup}>
                                        <div style={{ flex: 1 }}>
                                            <Form.Label className={styles.label}>Tenure</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="tenure"
                                                value={emiData.tenure}
                                                onChange={handleEmiChange}
                                                placeholder="Enter duration"
                                                className={styles.input}
                                            />
                                        </div>
                                        <div style={{ width: '100px', marginLeft: '10px' }}>
                                            <Form.Label className={`${styles.label} text-end d-block`}>Period</Form.Label>
                                            <Form.Select
                                                name="tenureType"
                                                value={emiData.tenureType}
                                                onChange={handleEmiChange}
                                                className={styles.input}
                                            >
                                                <option value="years">Years</option>
                                                <option value="months">Months</option>
                                            </Form.Select>
                                        </div>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate EMI</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Result Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {emiResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Result</h3>
                                        <div className={styles.resultRow}>
                                            <span>Loan Amount:</span>
                                            <strong>₹{(+emiResult.principal).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Total Interest:</span>
                                            <strong>₹{Math.round(emiResult.totalInterest).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Total Payment:</span>
                                            <strong>₹{Math.round(emiResult.totalPayment).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span>Monthly EMI:</span>
                                            <strong>₹{Math.round(emiResult.monthlyEMI).toLocaleString()}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Enter Loan Details</h4>
                                        <p className={styles.placeholderText}>Fill in the form to check your monthly EMI and total interest payable</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-calculator me-2"></i> Monthly Payments
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-percent me-2"></i> Interest Breakdown
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

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Container>
                    <div className={styles.aboutHeader}>
                        <h3>About EMI Components</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            An Equated Monthly Installment (EMI) is a fixed payment amount made by a borrower to a lender at a specified date each calendar month.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-money-bill-wave"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Principal Amount</h5>
                                        <p className={styles.articleDesc}>The original loan amount you borrowed from the lender.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-percent"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Interest Rate</h5>
                                        <p className={styles.articleDesc}>The rate at which the lender charges interest on the principal amount.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-calendar-check"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Loan Tenure</h5>
                                        <p className={styles.articleDesc}>The time period for which you have taken the loan.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-wallet"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Monthly Reducing</h5>
                                        <p className={styles.articleDesc}>Most home and personal loans works on reducing balance method.</p>
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

export default EMICalculator;
