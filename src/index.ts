import picgo from 'picgo'
import {
    getProjectInfo,
    removeMultiFiles,
    removeSingleFile,
    uploadMultiFiles,
    uploadSingleFile
} from "./utils/gitlabApiCall";
import {formatMessage, formatPath, replaceSlash} from "./utils/pathUtils";

const UPLOADER = 'gitlab-files-uploader'

export = (ctx: picgo) => {
    /**
     * 配置的常量
     */
    const config = (ctx: picgo) => {
        let userConfig = ctx.getConfig<GitlabFilesLoaderUserConfig>('picBed.gitlab-files-uploader')
        if (!userConfig) {
            userConfig = {
                gitUrl: '',
                projectId: 0,
                branch: 'master',
                fileName: '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
                authorMail: '',
                authorName: '',
                commitMessage: 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
                gitToken: '',
                deleteRemote: false,
                deleteMessage: "Delete {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}",
                deleteInform: false
            }
        }
        return [
            {
                name: 'gitUrl',
                type: 'input',
                default: userConfig.gitUrl,
                required: true,
                message: 'https://gitlab.com',
                alias: 'gitlab服务器地址'
            },
            {
                name: 'projectId',
                type: 'input',
                default: userConfig.projectId,
                required: true,
                message: '0',
                alias: '项目id，在项目设置页面查看'
            },
            {
                name: 'branch',
                type: 'input',
                default: userConfig.branch,
                required: true,
                message: 'master',
                alias: '默认分支,注意可能为main'
            },
            {
                name: 'fileName',
                type: 'input',
                default: userConfig.fileName,
                required: true,
                message: '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
                alias: '文件名及其路径'
            },
            {
                name: 'authorMail',
                type: 'input',
                default: userConfig.authorMail,
                required: true,
                message: 'test@example.com',
                alias: '上传者的邮箱'
            },
            {
                name: 'authorName',
                type: 'input',
                default: userConfig.authorName,
                required: true,
                message: 'example',
                alias: '上传者的用户名'
            },
            {
                name: 'commitMessage',
                type: 'input',
                default: userConfig.commitMessage,
                required: true,
                message: 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
                alias: '上传文件的Git Message'
            },
            {
                name: 'gitToken',
                type: 'input',
                default: userConfig.gitToken,
                required: true,
                message: 'gitlab的token',
                alias: 'gitlab的token'
            },
            {
                name: 'deleteRemote',
                type: 'input',
                default: userConfig.deleteRemote,
                required: true,
                message: 'false',
                alias: '是否同步删除远程对象'
            },
            {
                name: 'deleteMessage',
                type: 'input',
                default: userConfig.deleteMessage,
                required: true,
                message: 'Delete {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
                alias: '删除文件的Git Message'
            },
            {
                name: 'deleteInform',
                type: 'input',
                default: userConfig.deleteInform,
                required: true,
                message: 'false',
                alias: '删除远程图片后是否通知'
            }
        ]
    }

    /**
     * 核心方法
     */
    const handle = async (ctx: picgo) => {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find uploader config")
        }

        const imgList = ctx.output;
        imgList.forEach(img => {
            img['newPath'] = formatPath(img, userConfig.fileName)
        })
        const options = getProjectInfo(userConfig);
        const body = await ctx.Request.request(options);
        let resultPath = JSON.parse(body).web_url + "/-/raw/"

        let uploadOptions
        if (imgList.length === 1) {
            let img = imgList[0];
            if (!img.base64Image) {
                img.base64Image = img.buffer.toString('base64')
                delete img.buffer
            }

            uploadOptions = uploadSingleFile(userConfig,
                replaceSlash(img.newPath),
                formatMessage(userConfig.commitMessage, img.fileName),
                img.base64Image);

        } else {
            uploadOptions = uploadMultiFiles(userConfig, imgList)
        }

        await ctx.Request.request(uploadOptions).then(() => {
            imgList.forEach(img => {
                let imgUrl = `${resultPath + userConfig.branch}/${img.newPath}`
                delete img.base64Image
                img.url = imgUrl
                img.imgUrl = imgUrl
            })
        }).catch(err => {
            ctx.log.error('======Start Gitlab files Upload Error======')
            ctx.log.error(err)
            ctx.emit('notification', {
                title: 'gitlab 存储错误',
                body: '请检查配置是否正确,能否链接'
            })
            ctx.log.error('======End Gitlab files Error======')
        });

        return ctx
    }

    const onRemove = async function (files: RemoveImageType[]) {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find uploader config")
        }
        const rms = files.filter(each => each.type === UPLOADER)
        if (rms.length === 0 || !userConfig.deleteRemote) {
            return
        }
        let fail = false

        let options
        if (rms.length === 1) {
            options = removeSingleFile(userConfig, replaceSlash(rms[0].newPath), formatMessage(userConfig.commitMessage, rms[0].fileName));
        } else {
            options = removeMultiFiles(userConfig, rms)
        }

        await ctx.Request.request(options).catch((err) => {
            ctx.log.error('======Start Gitlab files Delete Error======')
            ctx.log.error(err)
            ctx.log.error('======End Gitlab Delete Error======')
            fail = true
        });
        if (userConfig.deleteInform) {
            ctx.emit('notification', {
                title: '远程删除提示',
                body: fail ? `删除远程图片失败` : '成功同步删除'
            });
        }
    }

    const register = () => {
        ctx.helper.uploader.register(UPLOADER, {
            handle,
            config,
            name: 'gitlab files 图片上传'
        })
        ctx.on('remove', onRemove)
    }

    return {
        uploader: UPLOADER,
        register
    }
}
