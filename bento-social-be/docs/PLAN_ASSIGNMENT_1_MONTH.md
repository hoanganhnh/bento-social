# Kế Hoạch Triển Khai: Từ Modular Monolith đến Microservices (Team 3 Người - 4 Tuần)

Tài liệu này đề xuất lộ trình làm việc chiến lược: Bắt đầu bằng việc xây dựng một **Modular Monolith** hoàn chỉnh để đảm bảo tiến độ nghiệp vụ, sau đó thực hiện **Refactoring tách thành Microservices** ở giai đoạn sau để phục vụ báo cáo và khả năng mở rộng.

## 👥 Thành Viên & Vai Trò

- **Thành viên 1 (Lead / Architect)**:
  - _Giai đoạn Monolith_: Thiết lập cấu trúc dự án chuẩn (Hexagonal), quy định Rules để các module không phụ thuộc chéo (Coupling), thiết lập Docker cơ bản.
  - _Giai đoạn Microservices_: Dựng hạ tầng (Gateway, RabbitMQ, Redis), tách Module thành Service độc lập.
- **Thành viên 2 (Backend Developer)**:
  - _Giai đoạn Monolith_: Tập trung code logic nghiệp vụ (Feature Implementation) nhanh nhất có thể.
  - _Giai đoạn Microservices_: Di chuyển code logic sang các service con, viết migration dữ liệu (nếu tách DB).
- **Thành viên 3 (Frontend / Fullstack)**:
  - _Giai đoạn Monolith_: Xây dựng UI/UX hoàn chỉnh, kết nối API Monolith.
  - _Giai đoạn Microservices_: Cập nhật/Kiểm tra lại kết nối API (qua Gateway), phát triển tính năng Realtime.

---

## 📅 Lộ Trình 4 Tuần (Sprints)

### 🟢 Tuần 1: Xây Dựng Modular Monolith Core

**Mục tiêu**: Có được một Backend Monolith chạy được các tính năng cơ bản (Auth, User) và Frontend khung. Code phải được tổ chức tách bạch (Modular) ngay từ đầu.

| Thành viên   | Công việc chi tiết                                                                                                                                                                                                                                                                      | Output                                                        |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **Member 1** | - Init **NestJS Monolith**: Cấu trúc `src/modules/{auth,user,post}`.<br>- Setup **PostgreSQL** & **Prisma**: Thiết kế schema chung nhưng chia file logic.<br>- Implement **Auth Module** (JWT, Guard) & Shared Utils.<br>- Định nghĩa Interface Communication (để sau này dễ tách RPC). | - Repo Monolith.<br>- DB Schema v1.<br>- Login/Register APIs. |
| **Member 2** | - Implement **User Module** (CRUD, Profile).<br>- Implement **Topic Module**.<br>- Viết Seed Data để có dữ liệu giả lập ngay.                                                                                                                                                           | - User/Topic APIs.<br>- Fake Data.                            |
| **Member 3** | - Setup **Frontend** (Next.js + Tailwind).<br>- Dựng Layout & Navigation.<br>- Tích hợp màn hình **Login/Register** với API Monolith.                                                                                                                                                   | - Web App chạy được.<br>- Login Flow ok.                      |

### 🟡 Tuần 2: Hoàn Thiện Nghiệp Vụ (Feature Complete)

**Mục tiêu**: Hoàn tất toàn bộ tính năng nghiệp vụ trên kiến trúc Monolith. App chạy ngon lành như một sản phẩm hoàn thiện.

| Thành viên   | Công việc chi tiết                                                                                                                                                                                                                                                           | Output                                                  |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **Member 1** | - Implement **Interaction Module** (Like, Follow).<br>- Setup **In-memory Event Emitter** (NodeJS Events) để xử lý logic chéo (Create Post -> Notify) => _Chuẩn bị cho RabbitMQ sau này_.<br>- Review code đảm bảo quy tắc "Không import trực tiếp Service giữa các Module". | - Full Monolith Backend.<br>- Internal Event System.    |
| **Member 2** | - Implement **Post Module** (Core feature).<br>- Implement **Comment Module**.<br>- Implement **Notification Module** (Lưu DB cơ bản).                                                                                                                                       | - Post/Comment APIs.<br>- Noti Data logic.              |
| **Member 3** | - Hoàn thiện các màn hình chính: **News Feed**, **Post Detail**, **Profile**.<br>- Tích hợp API Post, Comment, Like.<br>- Xử lý Upload ảnh (đơn giản lưu Local hoặc S3).                                                                                                     | - Fully Functional Web App.<br>- Demo được luồng chính. |

### 🔴 Tuần 3: The "Great Split" (Chuyển đổi sang Microservices)

**Mục tiêu**: Tách Backend Monolith thành hệ thống Microservices. Đây là phần quan trọng để viết báo cáo kỹ thuật sâu.

| Thành viên   | Công việc chi tiết                                                                                                                                                                                                                                                      | Output                                                                        |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Member 1** | - **Setup Infra**: Docker Compose full stack (Redis, RabbitMQ, Jaeger).<br>- **Build API Gateway**: Chuyển hướng request từ Client -> Các service con.<br>- Tách **Authentication** thành `auth-service` riêng biệt.                                                    | - Microservices Infra.<br>- Gateway running.<br>- Auth Service separated.     |
| **Member 2** | - Tách các module còn lại: `user-service`, `post-service`, `content-service`...<br>- **Tech Debt Payment**: Thay thế "NodeJS Event" ở tuần 2 bằng **RabbitMQ/Kafka**.<br>- Tách Connection Database (Mỗi service 1 DB riêng hoặc 1 Schema riêng).                       | - Multiple Services running.<br>- Isolated DBs.<br>- Async Messaging running. |
| **Member 3** | - **Adapter FE**: Sửa đổi Endpoint trên Frontend để gọi qua Gateway (thay vì gọi trực tiếp Monolith cũ).<br>- Implement **Socket.IO Service** riêng để làm Realtime Notification (Tận dụng sức mạnh Microservices).<br>- Test lại toàn bộ luồng E2E trên kiến trúc mới. | - FE connected to Gateway.<br>- Realtime Noti working.                        |

### 🔵 Tuần 4: Ổn Định, Tối Ưu & Viết Báo Cáo

**Mục tiêu**: Hệ thống Microservices chạy ổn định, có số liệu Benchmark để đưa vào báo cáo.

| Thành viên   | Công việc chi tiết                                                                                                                                                                                                               | Output                                        |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Member 1** | - Cấu hình **Monitoring/Logging** (Prometheus/Grafana/ELK) để chụp ảnh báo cáo.<br>- Viết chương: "Kiến trúc hệ thống & Quá trình Migration từ Monolith -> Microservices".<br>- Deployment (Docker Swarm/K8s nếu cần điểm cộng). | - Dashboards.<br>- Chương Kiến trúc & DevOps. |
| **Member 2** | - Stress Test hệ thống (JMeter/K6) để so sánh/chứng minh hiệu năng.<br>- Viết chương: "Cơ sở dữ liệu & Các kỹ thuật xử lý bất đồng bộ (Message Queue)".<br>- Fix bugs tồn đọng ở Backend.                                        | - Test Report.<br>- Chương Back-end.          |
| **Member 3** | - Polish UI/UX lần cuối (Hiệu ứng loading, Skeleton, Error handling).<br>- Viết chương: "Xây dựng Frontend & Trải nghiệm người dùng".<br>- Quay Video Demo, Làm Slide thuyết trình.                                              | - Final Product.<br>- Slide & Demo Video.     |

---

## 💡 Tại sao chọn cách tiếp cận này?

1.  **Giảm rủi ro (Risk Mitigation)**: Tuần 2 bạn đã có một sản phẩm Monolith chạy được. Nếu Tuần 3 tách Microservices bị lỗi quá nặng chưa fix kịp, bạn vẫn có thể nộp/demo bản Monolith (fallback plan).
2.  **Có câu chuyện để báo cáo**: Thay vì chỉ mô tả "Em làm Microservices", bạn có thể báo cáo "Em đã xây dựng Monolith, thấy vấn đề X, sau đó giải quyết bằng cách tách thành Microservices như thế này...". Đây là điểm rất mạnh trong đồ án.
3.  **Frontend không bị block**: Frontend dev có thể làm việc ngay với API Monolith ở tuần 1-2 mà không cần đợi hạ tầng Microservices phức tạp setup xong.
