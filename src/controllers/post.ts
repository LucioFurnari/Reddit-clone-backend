import { query, Request, Response } from "express";
import prisma from "../prisma";
import { z } from "zod";

// Create post validation schema
const createPostSchema = z.object({
  title: z.string().trim().min(8, { message: 'Title must be at least 8 characters long'}),
  content: z.string().trim().min(8, { message: 'Content must be at least 8 characters long'}).optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

// Create post controller
export async function createPost(req: Request, res: Response) {
  const { subredditId } = req.params;
  const authorId = req.user!.id;

  try {
    // Parse and validate request body
    const data: CreatePostData = createPostSchema.parse(req.body);

    // Create post
    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: authorId,
        subredditId: subredditId
      }
    });
    
    return res.status(201).json({ message: "Post created", post });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
    console.error("Error creating post:", err)
    return  res.status(500).json({ error: "Internal server error" });
  }
};

// Get posts by subreddit
export async function getSubRedditPosts(req: Request, res: Response) {
  const { subredditId } = req.params;

  try {
    const posts = await prisma.post.findMany({
      where: { subredditId },
      include: {
        author: {
          select: { id: true, username: true }, // Include author info
        },
        subreddit: {
          select: { id: true, name: true }, // Include subreddit info
        },
      },
      orderBy: { createdAt: "desc" }, // Order by creation date
    });

    if (posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this subreddit." });
    }

    return res.status(200).json({ message: "Post fetched successfully", posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get post by id
export async function getPostById(req: Request, res: Response) {
  const { postId } = req.params;

  try {
    // Fetch the post by ID
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, profilePictureUrl: true}
        },
        subreddit: {
          select: { id: true, name: true, description: true }, // Include subreddit  
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    // Handle case when post is not found
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    return res.status(200).json({ message: "Post fetched successfully", post });
  } catch (error) {
    console.error("Error fetching post: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Edit post by id

export async function editPost(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.id;

  try {
    // Parse and validate request body
    const data: CreatePostData = createPostSchema.parse(req.body);

    // Fetch the post with related data
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    };

    // Check if the user is the author or a moderator
    const isAuthor = post.authorId === userId;
    const isModerator = await prisma.userOnSubreddit.findFirst({
      where: {
        userId,
        subredditId: post.subredditId,
        role: "MODERATOR", // Check if is a moderator
      }
    });

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ error: "You are not authorized to perform this action." });
    };

    // Edit the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title || post.title,
        content: data.content !== undefined ? data.content : post.content,
      },
    });

    return res.status(200).json({ message: "Post updated successfully.", post: updatedPost });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    };
    console.error("Error editing post:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Delete post by id

export async function deletePost(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.id;
  try {
    // Fetch the post with related data
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        subredditId: true,
      }
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    };

    // Check if the user is the author or a moderator
    const isAuthor = post.authorId === userId;
    const isModerator = await prisma.userOnSubreddit.findFirst({
      where: {
        userId,
        subredditId: post.subredditId,
        role: "MODERATOR", // Check if is a moderator
      }
    });

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ error: "You are not authorized to perform this action." });
    };

    // Delete the post
    const updatedPost = await prisma.post.delete({
      where: { id: postId },
    });

    return res.status(200).json({ message: "Post deleted successfully.", post: updatedPost });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Define Zod schema for query validation
const searchPostsSchema = z.object({
  query: z.string().min(1, { message: "Query parameter is required and cannot be empty." }),
});

export async function searchPosts(req: Request, res: Response) {
  try {
    // Validate query parameters
    const { query } = searchPostsSchema.parse(req.query);
    console.log('Validated query:', query);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
    });
    console.log('Fetched posts:', posts);

    if (!posts.length || posts.length === 0) {
      return res.status(404).json({ message: "No posts found for the search query." });
    }

    return res.status(200).json({ message: "Posts fetched successfully.", posts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(", ") });
    }
    console.error("Error searching posts:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Get 10 posts

export async function getPosts(req: Request, res: Response) {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        karma: true,
        subreddit: {
          select: { name: true, id: true, iconUrl: true }
        },
        author: {
          select: { username: true, id: true }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
    });

    return res.status(200).json({ message: "Posts fetched successfully.", posts: posts });
  } catch (error) {
    console.error("Error getting posts", error);
    return res.status(500).json({ error: "Internal server error."});
  }
};

// Get subscribed posts

export async function getSubscribedPosts(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // Get the subreddit IDs the user is subscribed to
    const subscribedSubreddits = await prisma.userOnSubreddit.findMany({
      where: { userId: userId },
      select: { subredditId: true }
    })

    const subredditIds = subscribedSubreddits.map(sub => sub.subredditId);

    if (subredditIds.length === 0) {
      return res.status(200).json([]); // No subscribed subreddits
    };

    // Fetch posts from those subreddits
    const posts = await prisma.post.findMany({
      where: { subredditId: { in: subredditIds } },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        karma: true,
        subreddit: {
          select: { name: true, id: true, iconUrl: true }
        },
        author: {
          select: { username: true, id: true }
        },
        votes: { select: { value: true }, where: { userId }},
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    return res.status(200).json({ message: "Posts fetched successfully.", posts });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", details: error });
  }
}