export default {
    home: {
        title: "将您的矢量图转换至全新维度",
        uploadSection: {
            bestWith: "*最适合使用简单几何形状和透明背景的SVG文件。",
            continueButton: "进入编辑器",
            processing: "处理中..."
        },
        mobileWarning: {
            title: "检测到移动设备",
            description: "3D编辑器在桌面设备上效果最佳。在小屏幕上，某些功能可能受限或难以使用。",
            recommended: "推荐操作",
            switchDesktop: "请切换到台式机或笔记本电脑以获得最佳体验。",
            continueButton: "仍然继续使用移动设备",
            returnButton: "返回首页"
        },
        editorMobileWarning: {
            title: "检测到移动设备",
            description: "3D编辑器在桌面设备上效果最佳。在小屏幕上，某些功能可能受限或难以使用。",
            recommended: "推荐操作",
            switchDesktop: "请切换到台式机或笔记本电脑以获得3D编辑器的最佳体验。",
            continueButton: "仍然继续",
            returnButton: "返回首页"
        },
        footer: {
            hostedOn: "托管于",
            ideatedWith: "创意来自",
            by: "作者",
            localizedBy: "中文版本",
            localizer: "胡洪伟"
        },
        loading: "正在准备您的3D模型..."
    },
    notFound: {
        title: "页面未找到",
        description: "糟糕！您要查找的页面不存在。请检查URL或尝试搜索其他内容 :D",
        returnHome: "返回首页"
    },
    fileUpload: {
        clickOrDrop: "点击或拖动您的SVG文件到这里",
        makeThing3D: "让我们把它变成3D！",
        convertDescription: "我们将把它转换为3D模型，并让您编辑它",
        orChooseFrom: "或者从下面选择",
        dropHere: "拖动您的SVG文件到这里",
        svgErrorMessage: "请上传一个SVG文件 (.svg)"
    },
    edit: {
        backToHome: "返回",
        preview: {
            title: "预览",
            loadingSvg: "正在加载SVG数据...",
            processing: "正在处理SVG...",
            interact: "与您的3D模型交互"
        },
        customize: {
            title: "自定义",
        },
        tabs: {
            geometry: "几何",
            material: "材质",
            environment: "环境",
            background: "背景"
        },
        geometryControls: {
            depth: "厚度",
            bevel: {
                enable: "启用倒角",
                thickness: "倒角厚度",
                size: "倒角大小",
                segments: "倒角质量",
                presets: {
                    title: "倒角样式",
                    none: "无",
                    slight: "轻微",
                    medium: "中等",
                    strong: "强烈",
                    custom: "自定义"
                }
            },
            rotation: {
                autoRotate: "自动旋转模型",
                speed: "旋转速度"
            }
        },
        materialControls: {
            presets: {
                title: "材质类型",
                select: "选择材质类型",
                metallic: "金属",
                plastic: "塑料",
                clayMatte: "粘土/哑光",
                glass: "玻璃",
                custom: "自定义"
            },
            customColor: {
                enable: "覆盖SVG颜色",
                color: "自定义颜色"
            },
            properties: {
                roughness: "粗糙度",
                metalness: "金属感",
                clearcoat: "清漆",
                transmission: "透明度",
                envMapIntensity: "环境反射"
            }
        },
        environmentControls: {
            notice: {
                previewOnly: "环境设置仅用于预览，不会影响导出的3D模型。"
            },
            useEnvironment: "使用环境光照",
            presets: {
                title: "环境预设",
                select: "选择环境",
                apartment: "公寓 (室内)",
                city: "城市 (都市)",
                dawn: "黎明 (日出)",
                forest: "森林 (自然)",
                lobby: "大厅 (内部)",
                park: "公园 (白天)",
                studio: "工作室 (中性)",
                sunset: "日落 (暖色)",
                warehouse: "仓库 (工业)",
                custom: "自定义"
            },
            customImage: {
                info: "您的图像将用于3D模型的反射",
                change: "更改图像"
            },
            vibeMode: {
                enable: "启用氛围模式",
                disable: "禁用氛围模式",
                notAvailable: "自定义图像不支持氛围模式",
                customNotSupported: "自定义图像不支持氛围模式",
                maintained: "已保持自定义环境",
                disabled: "氛围模式已被禁用",
                glowIntensity: "发光强度",
                softGlow: "柔和发光",
                modelRotation: "模型旋转"
            },
            errors: {
                noFile: "未选择文件",
                unsupportedFormat: "不支持的文件格式：仅支持JPG和PNG",
                fileTooLarge: "文件过大：图像必须小于10MB",
                processingFailed: "处理图像失败",
                readFailed: "读取图像文件失败"
            },
            success: {
                imageUploaded: "图像上传成功"
            }
        },
        backgroundControls: {
            notice: {
                previewOnly: "背景设置仅用于预览，不会包含在导出的3D模型中。"
            },
            backgroundColor: "背景颜色",
            currentlyUsing: "当前使用：",
            customSelection: "自定义选择",
            themeDefault: "主题默认",
            customColor: "自定义颜色",
            resetToThemeDefault: "重置为主题默认值",
            presets: {
                light: "明亮",
                dark: "深色",
                blue: "蓝色",
                gray: "灰色",
                green: "绿色"
            }
        },
        export: {
            buttons: {
                exportImage: "导出图片",
                export3D: "导出3D模型"
            },
            formats: {
                stl: "导出为STL",
                glb: "导出为GLB",
                gltf: "导出为GLTF"
            },
            quality: {
                low: "低质量",
                medium: "中等质量",
                high: "高质量"
            },
            errors: {
                modelNotLoaded: "错误：无法导出 - 模型未加载",
                canvasNotFound: "找不到3D渲染器",
                canvasContext: "无法获取导出画布的2D上下文",
                imageGenerationFailed: "生成图片失败",
                exportFailed: "导出{format}失败",
                exportError: "导出失败：{message}",
                unknown: "未知错误"
            },
            success: {
                imageSaved: "图片已保存为{name}",
                modelSaved: "{name}已成功下载"
            }
        },
        loading: {
            waiting: "正在等待SVG数据...",
            generating: "正在生成3D模型...",
            complexSvg: "复杂的SVG可能需要更多时间"
        },
        error: {
            title: "处理SVG时出错",
            tryAgain: "重试"
        }
    }
} as const;