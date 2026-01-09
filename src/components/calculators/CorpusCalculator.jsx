import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from "./CorpusCalculator.module.css";

const CorpusCalculator = () => {
    const [corpusData, setCorpusData] = useState({
        targetAmount: "",
        interestRate: "",
        timePeriod: "",
    });

    const [corpusResult, setCorpusResult] = useState(null);

    const handleCorpusChange = (e) => {
        setCorpusData({
            ...corpusData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateCorpus = (e) => {
        e.preventDefault();
        const target = parseFloat(corpusData.targetAmount);
        const annualRate = parseFloat(corpusData.interestRate) / 100;
        const years = parseFloat(corpusData.timePeriod);

        if (target && annualRate && years) {
            const months = years * 12;
            const monthlyRate = annualRate / 12;

            // Formula for Target SIP: P = FV / [ ( (1+r)^n - 1 ) * (1+r)/r ]
            // where P is monthly investment, FV is target corpus

            const factor = ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate)) / monthlyRate;
            const requiredMonthlyInvestment = target / factor;

            const totalInvestment = requiredMonthlyInvestment * months;
            const interestEarned = target - totalInvestment;

            // Generate Yearly Data for Bar Chart (Corpus Growth if you follow the plan)
            const yearlyData = [];
            for (let i = 1; i <= years; i++) {
                const monthsPassed = i * 12;
                // SIP Formula to check value at year i with the calculated monthly amount
                const currentCorpus = requiredMonthlyInvestment * ((Math.pow(1 + monthlyRate, monthsPassed) - 1) / monthlyRate) * (1 + monthlyRate);

                yearlyData.push({
                    name: `Year ${i}`,
                    value: Math.round(currentCorpus),
                    label: `Year ${i}`
                });
            }

            setCorpusResult({
                requiredMonthlyInvestment,
                totalInvestment,
                interestEarned,
                targetAmount: target,
                yearlyData
            });
        }
    };

    const resetCalculator = () => {
        setCorpusData({
            targetAmount: "",
            interestRate: "",
            timePeriod: "",
        });
        setCorpusResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>CORPUS CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>Target Corpus Goal</h3>
                                <p className={styles.boxSubtitle}>Calculate monthly investment needed for your goal</p>

                                <Form onSubmit={calculateCorpus}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Target Amount (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="targetAmount"
                                            value={corpusData.targetAmount}
                                            onChange={handleCorpusChange}
                                            placeholder="Enter your goal amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>The corpus you want to build</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Expected Return (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="interestRate"
                                            value={corpusData.interestRate}
                                            onChange={handleCorpusChange}
                                            placeholder="Enter expected annual return"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Annual rate of return expected</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Time Period (Years)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="timePeriod"
                                            value={corpusData.timePeriod}
                                            onChange={handleCorpusChange}
                                            placeholder="Enter years"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Number of years to achieve goal</Form.Text>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate Investment</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Result Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {corpusResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Plan Required</h3>
                                        <div className={styles.resultRow} style={{ borderBottom: 'none' }}>
                                            <span style={{ fontSize: '16px' }}>You need to invest monthly:</span>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`} style={{ marginTop: '0', paddingTop: '0' }}>
                                            <strong style={{ fontSize: '32px' }}>₹{Math.round(corpusResult.requiredMonthlyInvestment).toLocaleString()}</strong>
                                        </div>

                                        <div className={styles.resultRow} style={{ marginTop: '20px' }}>
                                            <span>Target Corpus:</span>
                                            <strong>₹{(+corpusResult.targetAmount).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Total Investment:</span>
                                            <strong>₹{Math.round(corpusResult.totalInvestment).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Interest Earned:</span>
                                            <strong>₹{Math.round(corpusResult.interestEarned).toLocaleString()}</strong>
                                        </div>

                                        {/* Charts Section */}
                                        <div style={{ marginTop: '30px' }}>
                                            <h5 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#182724' }}>
                                                Goal Analysis
                                            </h5>

                                            {/* Pie Chart */}
                                            <div style={{ width: '100%', height: '250px', marginBottom: '20px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Investment', value: Math.round(corpusResult.totalInvestment) },
                                                                { name: 'Interest', value: Math.round(corpusResult.interestEarned) }
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

                                            {/* Bar Chart - Yearly Accumulated Corpus */}
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                                                    Corpus Growth Path
                                                </h5>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={corpusResult.yearlyData}
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
                                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Accumulated"]}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Legend verticalAlign="top" />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Accumulated"
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
                                        <h4 className={styles.placeholderTitle}>Financial Freedom</h4>
                                        <p className={styles.placeholderText}>Find out how much you need to save to reach your dreams</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-bullseye me-2"></i> Goal Based
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-road me-2"></i> Clear Roadmap
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-chart-pie me-2"></i> Future Planning
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
                        <h3>About Corpus Building</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            Building a corpus is about disciplined investing towards a specific financial goal. Knowing how much to invest monthly is the first step towards achieving it.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-bullseye"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Goal Setting</h5>
                                        <p className={styles.articleDesc}>Define your target amount clearly (e.g., 1 Crore for retirement).</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-clock"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Power of Time</h5>
                                        <p className={styles.articleDesc}>Starting early reduces the monthly investment required significantly.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-chart-line"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Compounding</h5>
                                        <p className={styles.articleDesc}>Let your interest earn more interest to reach the target faster.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-check-double"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Inflation</h5>
                                        <p className={styles.articleDesc}>Always account for inflation when setting your target corpus amount.</p>
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

export default CorpusCalculator;
