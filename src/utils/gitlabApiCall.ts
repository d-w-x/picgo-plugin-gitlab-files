import {IImgInfo} from "picgo/dist/src/types";
import {formatMessage} from "./pathUtils";

/**
 * 使用 Gitlab Api 获取项目的信息
 */
export function getProjectInfo(userConfig: GitlabFilesLoaderUserConfig) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId
    }

    return {
        method: 'GET',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
        }
    }
}

/**
 * 使用 Gitlab Api 向服务器进行一次单文件提交
 */
export function uploadSingleFile(userConfig: GitlabFilesLoaderUserConfig, filePath: string, commitMessage: string, base64Image: string) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    }

    return {
        method: 'POST',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
            'Content-Type': 'application/json',
            'User-Agent': 'PicGo'
        },
        body: {
            branch: userConfig.branch,
            author_email: userConfig.authorMail,
            author_name: userConfig.authorName,
            encoding: "base64",
            commit_message: commitMessage,
            content: base64Image
        },
        json: true
    }
}

/**
 * 使用 Gitlab Api 向服务器进行一次多文件提交
 */
export function uploadMultiFiles(userConfig: GitlabFilesLoaderUserConfig, outputs: IImgInfo[]) {
    let actions = outputs.map(output => {
        if (!output.base64Image) {
            output.base64Image = output.buffer.toString('base64')
            delete output.buffer
        }
        return {
            action: 'create',
            file_path: output.newPath,
            encoding: 'base64',
            content: output.base64Image,
        }
    })

    return postMultiFiles(userConfig,
        actions,
        formatMessage(userConfig.commitMessage, `"${outputs/*.slice(0, 3)*/.map(output => output.fileName).join('" & "')}"`))
}

/**
 * 使用 Gitlab Api 向服务器进行一次单文件删除
 */
export function removeSingleFile(userConfig: GitlabFilesLoaderUserConfig, filePath: string, deleteMessage: string) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/files/" + filePath;
    }

    return {
        method: 'DELETE',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
            'Content-Type': 'application/json',
            'User-Agent': 'PicGo'
        },
        body: {
            branch: userConfig.branch,
            author_email: userConfig.authorMail,
            author_name: userConfig.authorName,
            commit_message: deleteMessage,
        },
        json: true
    }
}

/**
 * 使用 Gitlab Api 向服务器进行一次多文件删除
 */
export function removeMultiFiles(userConfig: GitlabFilesLoaderUserConfig, files: RemoveImageType[]) {
    let actions = files.map(file => {
        return {
            action: 'delete',
            file_path: file.newPath
        }
    })

    return postMultiFiles(userConfig,
        actions,
        formatMessage(userConfig.deleteMessage, `"${files/*.slice(0, 3)*/.map(output => output.fileName).join('" & "')}"`))
}

/**
 * 使用 Gitlab Api 向服务器进行一次多文件提交,可以是增删改查的混合
 */
function postMultiFiles(userConfig: GitlabFilesLoaderUserConfig, actions, gitMessage: string) {
    let url: string
    if (userConfig.gitUrl.endsWith("/")) {
        url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/commits"
    } else {
        url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/commits"
    }

    return {
        method: 'POST',
        url: url,
        headers: {
            'PRIVATE-TOKEN': userConfig.gitToken,
            Date: new Date().toUTCString(),
            'Content-Type': 'application/json',
            'User-Agent': 'PicGo'
        },
        body: {
            id: userConfig.projectId,
            branch: userConfig.branch,
            commit_message: gitMessage,
            author_email: userConfig.authorMail,
            author_name: userConfig.authorName,
            actions: actions
        },
        json: true
    }
}