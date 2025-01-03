import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../../UserContext';
import WriteForm from './WriteForm';
import ViewPost from './ViewPost';

interface Post {
  id: string;
  title: string;
  content: string;
  userNickname?: string;
  userImage?: string;
  created: any;
  views: number;
  likes: number;
  postCount: number; // 번호 계산을 위한 속성
}

const PostList: React.FC = () => {
  const { userData } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 페이지 번호
  const [searchTerm, setSearchTerm] = useState<string>(''); // 검색어 저장
  const [isWriteFormModalOpen, setIsWriteFormModalOpen] = //글쓰기 모달의 열림 상태 관리
    useState<boolean>(false);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = // 게시글 보기 모달의 열림 상태 관리
    useState<boolean>(false);
  const [posts, setPosts] = useState<any[]>([]); // 게시글 목록을 저장하는 상태
  const postsPerPage = 10;
  const [selectedPost, setSelectedPost] = useState<any>(null); // 선택한 게시글을 저장하는 상태

  // 컴포넌트 마운트 시 DB에서 게시글 데이터 가져옴
  useEffect(() => {
    const q = query(collection(db, 'Community'), orderBy('created', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: any[] = [];
      querySnapshot.forEach((doc) => {
        // 각 문서 순회
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    });
    return () => unsubscribe(); // 컴포넌트 언마운트 시 리스너 정리
  }, []);

  // 검색된 게시글 필터링
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userNickname?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 페이지네이션
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost); // 현재 페이지에 표시할 게시글 목록 계산
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage); // 총 페이지 수 계산
  const pageNumbers = [...Array(totalPages).keys()].map((num) => num + 1); // 각 페이지 번호 생성

  // 페이지 이동 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // 게시글 작성 핸들러
  const handleWritePost = () => {
    if (!userData) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    setIsWriteFormModalOpen(true); // 모달 열기
  };

  const closeWriteFormModal = () => {
    setIsWriteFormModalOpen(false); // 모달 닫기
  };

  // 특정 게시글 클릭 시 해당 게시글을 자세히 보여주는 모달 오픈
  const handleViewPost = (post: Post) => {
    setSelectedPost(post); // 선택한 게시글 설정
    setIsViewPostModalOpen(true); // 모달 열기
  };

  const closeViewPostModal = () => {
    setIsViewPostModalOpen(false); // 모달 닫기
    setSelectedPost(null); // 선택한 게시글 초기화
  };

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>번호</th>
            <th style={{ width: '55%' }}>제목</th>
            <th style={{ width: '15%' }}>글쓴이</th>
            <th style={{ width: '60px' }}>등록</th>
            <th>조회</th>
            <th>추천</th>
          </tr>
        </thead>
        <tbody>
          {currentPosts.map((post) => (
            <tr key={post.id}>
              <td>{post.postCount}</td> {/* 번호 계산 */}
              <TitleCell onClick={() => handleViewPost(post)}>
                {post.title}
              </TitleCell>
              <td>
                <img
                  src={post.userImage}
                  style={{
                    maxWidth: '20px',
                    borderRadius: '20px',
                    marginRight: '8px',
                  }}
                  alt="User Avatar"
                />
                {post.userNickname || '익명'}
              </td>{' '}
              <td>
                {post.created
                  ?.toDate()
                  .toLocaleDateString('en-US', {
                    month: '2-digit', // 두 자리 월
                    day: '2-digit', // 두 자리 일
                  })
                  .replace(',', '')}{' '}
                {post.created?.toDate().toLocaleTimeString('en-US', {
                  hour: '2-digit', // 두 자리 시
                  minute: '2-digit', // 두 자리 분
                  hour12: false, // 24시간 형식
                })}{' '}
                {/* HH:MM 형식 */}
              </td>
              <td>{post.views}</td>
              <td>{post.likes}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination>
        <Button onClick={handlePrevPage} disabled={currentPage === 1}>
          이전
        </Button>
        {pageNumbers.map((number) => (
          <PageButton
            key={number}
            onClick={() => setCurrentPage(number)}
            isActive={number === currentPage} // 현재 페이지 상태 전달
          >
            {number}
          </PageButton>
        ))}
        <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
          다음
        </Button>
      </Pagination>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="제목이나 글쓴이로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <WriteButton onClick={handleWritePost}>글쓰기</WriteButton>
      </SearchContainer>
      {isWriteFormModalOpen && (
        <WriteForm
          closeModal={closeWriteFormModal}
          postCount={filteredPosts.length} // 게시글 수 전달
        />
      )}
      {isViewPostModalOpen && selectedPost && (
        <ViewPost post={selectedPost} closeModal={closeViewPostModal} />
      )}
      <div style={{ paddingBottom: '50px' }} /> {/* 추가 여백 */}
    </>
  );
};

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const SearchInput = styled.input`
  padding: 10px;
  width: 300px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const WriteButton = styled.button`
  padding: 10px 15px;
  margin-left: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0069d9;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;

  th {
    background-color: #89ade1;
    color: white;
    padding: 12px;
    text-align: left;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #ddd;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2; /* 짝수 행 배경색 */
  }

  tr:hover {
    background-color: #ddd; /* 마우스 오버 시 배경색 */
  }

  th,
  td {
    text-align: center; /* 글씨를 가운데 정렬 */
    border: 1px solid #ddd; /* 테두리 */
  }

  th {
    position: sticky;
    top: 0; /* 헤더 고정 */
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  // isActive prop 추가
  margin: 0 5px;
  padding: 10px 15px;
  background-color: ${({ isActive }) =>
    isActive ? '#2a0c0c' : '#4caf50'}; // 현재 페이지 색상
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: ${({ isActive }) =>
      isActive ? '#0069d9' : '#45a049'}; // 현재 페이지 호버 색상
  }
`;

const Button = styled(PageButton)`
  background-color: #007bff;

  &:hover {
    background-color: #0069d9;
  }

  &:disabled {
    background-color: #c0c0c0;
    cursor: not-allowed;
  }
`;

const TitleCell = styled.td`
  padding: 12px;
  text-align: center;
  cursor: pointer; /* 클릭 가능성을 암시하는 커서 */
  transition: background-color 0.3s ease, color 0.3s ease; /* 부드러운 전환 효과 추가 */

  &:hover {
    color: #007bff; /* hover 시 텍스트 색상 변경 */
  }
`;

export default PostList;
