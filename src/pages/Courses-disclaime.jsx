import React from "react";
import { Container, Card } from "react-bootstrap";

function CourseDisclaimer() {
  return (
    <section style={{ backgroundColor: "#e9ecef", padding: "40px 0" }}>
      <Container className="my-5">
        <Card
          className="p-4 shadow-sm border-0"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <div className="text-center mb-4">
            <i className="fas fa-exclamation-triangle text-warning mb-3" style={{fontSize: "40px"}}></i>
            <h1 className="mb-2">Important Note</h1>
            <p className="text-muted">Must Read Before Making a Purchase</p>
          </div>

          <div className="disclaimer-points">
            <div className="d-flex align-items-start mb-4">
              <i className="fas fa-book text-primary mt-1 me-3" style={{fontSize: "20px"}}></i>
              <div>
                <h6 className="fw-bold mb-2">Educational Purpose Only</h6>
                <p className="mb-0">
                  This course is offered solely for educational purposes and is intended for beginners 
                  who wish to learn about the Trading and indicators I use. Participation in this course 
                  is voluntary—you are not required or pressured to enroll. By purchasing, you acknowledge 
                  and agree that no refunds will be granted once access is provided. Trading involves 
                  inherent risk and may not be suitable for everyone. Any examples, techniques, or strategies 
                  discussed are for demonstration only and do not constitute financial or investment advice. 
                  Always conduct your own research or consult a licensed professional before making trading decisions.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start mb-4">
              <i className="fas fa-exclamation-circle text-danger mt-1 me-3" style={{fontSize: "20px"}}></i>
              <div>
                <h6 className="fw-bold mb-2 text-danger">IMPORTANT</h6>
                <p className="mb-0">
                  WE DIDN'T PROVIDE ANY KIND OF TIPS OR CALLS ARE SUGGESTIONS TO ANYONE. The courses are only 
                  for educational purpose. If you purchasing this courses for tips kindly don't waste your money and time.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start mb-4">
              <i className="fas fa-graduation-cap text-info mt-1 me-3" style={{fontSize: "20px"}}></i>
              <div>
                <h6 className="fw-bold mb-2">No Profit Guarantee</h6>
                <p className="mb-0">
                  This courses are only for educational purpose. We don't give you the guarantee if you purchase 
                  this course you will be profitable. But you will know about our trading strategy and more.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}

export default CourseDisclaimer;