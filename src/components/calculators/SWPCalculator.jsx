import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import styles from "./SWPCalculator.module.css";

const SWPCalculator = () => {
    const [swpData, setSwpData] = useState({
        initialInvestment: "",
        withdrawalAmount: "",
        withdrawalFrequency: "monthly",
        expectedReturn: "",
        timePeriod: "",
    });

    const [swpResult, setSwpResult] = useState(null);

    const handleSwpChange = (e) => {
        setSwpData({
            ...swpData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateSWP = (e) => {
        e.preventDefault();
        const initialInvestment = parseFloat(swpData.initialInvestment);
        const withdrawalAmount = parseFloat(swpData.withdrawalAmount);
        const annualReturn = parseFloat(swpData.expectedReturn) / 100;
        const timePeriod = parseFloat(swpData.timePeriod);

        let periodsPerYear = 12;
        if (swpData.withdrawalFrequency === "quarterly") periodsPerYear = 4;
        if (swpData.withdrawalFrequency === "yearly") periodsPerYear = 1;

        const totalPeriods = timePeriod * periodsPerYear;
        const periodicReturn = annualReturn / periodsPerYear;

        if (initialInvestment && withdrawalAmount && annualReturn && timePeriod) {
            let remainingAmount = initialInvestment;
            let totalWithdrawals = 0;
            let isSustainable = true;
            let monthsUntilDepletion = totalPeriods;

            for (let period = 1; period <= totalPeriods; period++) {
                // Returns added first
                const returns = remainingAmount * periodicReturn;
                remainingAmount += returns;

                // Then withdraw
                remainingAmount -= withdrawalAmount;

                if (remainingAmount < 0) {
                    isSustainable = false;
                    monthsUntilDepletion = period;
                    remainingAmount = 0; // Cap at 0
                    break;
                }
            }

            totalWithdrawals = withdrawalAmount * (isSustainable ? totalPeriods : monthsUntilDepletion);
            const totalReturns = totalWithdrawals + remainingAmount - initialInvestment;

            setSwpResult({
                initialInvestment,
                totalWithdrawals,
                finalAmount: remainingAmount,
                totalReturns: totalReturns > 0 ? totalReturns : 0,
                isSustainable,
                monthsUntilDepletion
            });
        }
    };

    const resetCalculator = () => {
        setSwpData({
            initialInvestment: "",
            withdrawalAmount: "",
            withdrawalFrequency: "monthly",
            expectedReturn: "",
            timePeriod: "",
        });
        setSwpResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>SWP CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>SWP Calculation</h3>
                                <p className={styles.boxSubtitle}>Enter your investment details to calculate returns</p>

                                <Form onSubmit={calculateSWP}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Initial Investment (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="initialInvestment"
                                            value={swpData.initialInvestment}
                                            onChange={handleSwpChange}
                                            placeholder="Enter initial amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Amount you want to invest</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Withdrawal Amount (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="withdrawalAmount"
                                            value={swpData.withdrawalAmount}
                                            onChange={handleSwpChange}
                                            placeholder="Enter withdrawal amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Periodical withdrawal amount</Form.Text>
                                    </div>

                                    <div className={styles.rowGroup}>
                                        <div style={{ flex: 1 }}>
                                            <Form.Label className={styles.label}>Frequency</Form.Label>
                                            <Form.Select
                                                name="withdrawalFrequency"
                                                value={swpData.withdrawalFrequency}
                                                onChange={handleSwpChange}
                                                className={styles.input}
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="yearly">Yearly</option>
                                            </Form.Select>
                                        </div>
                                        <div style={{ flex: 1, marginLeft: '10px' }}>
                                            <Form.Label className={styles.label}>Period (Years)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="timePeriod"
                                                value={swpData.timePeriod}
                                                onChange={handleSwpChange}
                                                placeholder="Enter years"
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Expected Annual Return (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="expectedReturn"
                                            value={swpData.expectedReturn}
                                            onChange={handleSwpChange}
                                            placeholder="Enter expected return"
                                            className={styles.input}
                                        />
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
                                {swpResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>SWP Results</h3>
                                        <div className={styles.resultRow}>
                                            <span>Total Withdrawals:</span>
                                            <strong>₹{Math.round(swpResult.totalWithdrawals).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Final Amount:</span>
                                            <strong>₹{Math.round(swpResult.finalAmount).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Status:</span>
                                            <strong style={{ color: swpResult.isSustainable ? '#14B8A6' : '#FF4D4F' }}>
                                                {swpResult.isSustainable ? "Sustainable" : "Funds Depleted"}
                                            </strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span style={{ fontSize: '18px' }}>Total Value Generated:</span>
                                            <strong>₹{Math.round(swpResult.totalWithdrawals + swpResult.finalAmount).toLocaleString()}</strong>
                                        </div>
                                        {!swpResult.isSustainable && (
                                            <p className="mt-3 text-danger small">
                                                Funds will deplete after {swpResult.monthsUntilDepletion} periods.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Enter SWP Details</h4>
                                        <p className={styles.placeholderText}>Fill in the form to see your withdrawal plan projections</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-coins me-2"></i> Regular Income
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-shield-alt me-2"></i> Wealth Preservation
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
                        <h3>About Systematic Withdrawal Plan (SWP)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            SWP is a facility offered by mutual funds where you can withdraw a fixed amount regularly from your mutual fund investments, providing a steady income stream.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-coins"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Regular Income</h5>
                                        <p className={styles.articleDesc}>Get a steady stream of income (monthly/quarterly) from your investments.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-chart-column"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Tax Efficiency</h5>
                                        <p className={styles.articleDesc}>Withdrawals are treated as capital returns, often making them more tax-efficient than FD interest.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-hand-holding-dollar"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Flexibility</h5>
                                        <p className={styles.articleDesc}>Choose your withdrawal amount and frequency based on your financial needs.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-shield-halved"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Wealth Preservation</h5>
                                        <p className={styles.articleDesc}>While withdrawing, your remaining principal continues to earn returns.</p>
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

export default SWPCalculator;
