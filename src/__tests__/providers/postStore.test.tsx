import { renderHook, act } from '@testing-library/react';
import { PostProvider, usePostContext } from '@/providers/postStore';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PostStore', () => {
  const mockPost = {
    id: 1,
    title: 'Test Post',
    brief: 'Test Brief',
    description: 'Test Description',
    imageUrl: 'test-image.jpg',
    author: 'Test Author',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    published: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createPost should add new post', async () => {
    mockedAxios.post.mockResolvedValueOnce({ 
      data: { data: mockPost, error: null } 
    });

    const { result } = renderHook(() => usePostContext(), {
      wrapper: PostProvider
    });

    await act(async () => {
      await result.current.createPost({
        title: 'Test Post',
        brief: 'Test Brief',
        description: 'Test Description',
        imageUrl: 'test-image.jpg',
        author: 'Test Author',
        content: 'Test Content'
      });
    });

    expect(result.current.data).toContainEqual(mockPost);
    expect(result.current.error).toBeNull();
  });

  test('getAllPosts should fetch posts', async () => {
    mockedAxios.get.mockResolvedValueOnce({ 
      data: { posts: [mockPost], error: null } 
    });

    const { result } = renderHook(() => usePostContext(), {
      wrapper: PostProvider
    });

    await act(async () => {
      await result.current.getAllPosts();
    });

    expect(result.current.data).toEqual([mockPost]);
    expect(result.current.loading).toBeFalsy();
  });

  test('deletePost should remove post', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ 
      data: { error: null } 
    });

    const { result } = renderHook(() => usePostContext(), {
      wrapper: PostProvider
    });

    result.current.setData([mockPost]);

    await act(async () => {
      await result.current.deletePost(1);
    });

    expect(result.current.data).toEqual([]);
  });
});
