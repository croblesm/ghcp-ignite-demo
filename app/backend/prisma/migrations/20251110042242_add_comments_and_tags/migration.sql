BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Post] DROP CONSTRAINT [Post_authorId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Author] ADD [bio] NVARCHAR(max);

-- CreateTable
CREATE TABLE [dbo].[Comment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [content] NVARCHAR(max) NOT NULL,
    [postId] INT NOT NULL,
    [authorId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Comment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Comment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(100) NOT NULL,
    CONSTRAINT [Tag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tag_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[PostTag] (
    [postId] INT NOT NULL,
    [tagId] INT NOT NULL,
    CONSTRAINT [PostTag_pkey] PRIMARY KEY CLUSTERED ([postId],[tagId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Post] ADD CONSTRAINT [FK_Post_Author] FOREIGN KEY ([authorId]) REFERENCES [dbo].[Author]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_Post] FOREIGN KEY ([postId]) REFERENCES [dbo].[Post]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_Author] FOREIGN KEY ([authorId]) REFERENCES [dbo].[Author]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PostTag] ADD CONSTRAINT [FK_PostTag_Post] FOREIGN KEY ([postId]) REFERENCES [dbo].[Post]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PostTag] ADD CONSTRAINT [FK_PostTag_Tag] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
